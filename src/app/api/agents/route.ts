import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().optional(),
  model: z.string().default("claude-sonnet-4-6"),
  projectId: z.string(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const agents = await db.agent.findMany({
    where: {
      project: { userId: session.user.id },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      connectors: true,
      _count: { select: { conversations: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify the project belongs to this user
  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const agent = await db.agent.create({
    data: parsed.data,
    include: { connectors: true },
  });

  return NextResponse.json(agent, { status: 201 });
}
