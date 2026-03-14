import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { ConnectorType } from "@prisma/client";

const createConnectorSchema = z.object({
  agentId: z.string(),
  type: z.nativeEnum(ConnectorType),
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()),
  enabled: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createConnectorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: { id: parsed.data.agentId, project: { userId: session.user.id } },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const connector = await db.agentConnector.create({
    data: parsed.data,
  });

  return NextResponse.json(connector, { status: 201 });
}
