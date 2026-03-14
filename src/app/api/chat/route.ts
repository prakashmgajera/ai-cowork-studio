import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamChat } from "@/lib/anthropic";
import { retrieveRelevantContext } from "@/lib/rag";
import { z } from "zod";

const chatSchema = z.object({
  agentId: z.string(),
  conversationId: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { agentId, message } = parsed.data;
  let { conversationId } = parsed.data;

  // Load agent (verify ownership)
  const agent = await db.agent.findFirst({
    where: { id: agentId, project: { userId: session.user.id } },
    include: { project: { select: { id: true } } },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await db.conversation.findFirst({
      where: { id: conversationId, agentId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        agentId,
        title: message.slice(0, 60),
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    conversationId = conversation.id;
  }

  // Persist user message
  await db.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: message,
    },
  });

  // Retrieve RAG context
  const ragContext = await retrieveRelevantContext(
    agent.project.id,
    message,
    5
  );

  // Build message history
  const history = conversation.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: message });

  // Stream response from Claude
  const stream = await streamChat({
    messages: history,
    systemPrompt: agent.systemPrompt ?? undefined,
    model: agent.model,
    ragContext: ragContext || undefined,
  });

  let assistantMessage = "";

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ conversationId })}\n\n`)
      );

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          assistantMessage += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      }

      // Persist assistant message
      await db.message.create({
        data: {
          conversationId: conversation!.id,
          role: "assistant",
          content: assistantMessage,
        },
      });

      // Update conversation timestamp
      await db.conversation.update({
        where: { id: conversation!.id },
        data: { updatedAt: new Date() },
      });

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
