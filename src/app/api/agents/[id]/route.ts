import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
});

async function getAgentOrFail(id: string, userId: string) {
  return db.agent.findFirst({
    where: { id, project: { userId } },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const agent = await db.agent.findFirst({
    where: { id, project: { userId: session.user.id } },
    include: {
      connectors: true,
      project: { select: { id: true, name: true } },
      conversations: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: { _count: { select: { messages: true } } },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getAgentOrFail(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const agent = await db.agent.update({
    where: { id },
    data: parsed.data,
    include: { connectors: true },
  });

  return NextResponse.json(agent);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getAgentOrFail(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await db.agent.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
