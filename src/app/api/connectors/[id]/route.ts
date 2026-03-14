import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateConnectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const connector = await db.agentConnector.findFirst({
    where: { id, agent: { project: { userId: session.user.id } } },
  });

  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateConnectorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Prisma.AgentConnectorUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.config !== undefined)
    data.config = parsed.data.config as unknown as Prisma.InputJsonValue;

  const updated = await db.agentConnector.update({ where: { id }, data });

  return NextResponse.json(updated);
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

  const connector = await db.agentConnector.findFirst({
    where: { id, agent: { project: { userId: session.user.id } } },
  });

  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  await db.agentConnector.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
