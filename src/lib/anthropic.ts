import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function streamChat({
  messages,
  systemPrompt,
  model = "claude-sonnet-4-6",
  ragContext,
}: {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  ragContext?: string;
}) {
  let system = systemPrompt || "You are a helpful AI assistant.";

  if (ragContext) {
    system += `\n\n## Relevant context from project documents:\n\n${ragContext}\n\nUse the above context to answer questions when relevant.`;
  }

  const formattedMessages: MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system,
    messages: formattedMessages,
  });
}

export async function chat({
  messages,
  systemPrompt,
  model = "claude-sonnet-4-6",
  ragContext,
}: {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  ragContext?: string;
}) {
  let system = systemPrompt || "You are a helpful AI assistant.";

  if (ragContext) {
    system += `\n\n## Relevant context from project documents:\n\n${ragContext}\n\nUse the above context to answer questions when relevant.`;
  }

  const formattedMessages: MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: formattedMessages,
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
