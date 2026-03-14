import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDocument, indexDocument } from "@/lib/rag";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? "10") * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/csv",
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const documents = await db.document.findMany({
    where: { projectId },
    include: { _count: { select: { chunks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json(
      { error: "file and projectId are required" },
      { status: 400 }
    );
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds ${process.env.MAX_FILE_SIZE_MB ?? 10}MB limit` },
      { status: 413 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, Word, TXT, Markdown, CSV" },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await parseDocument(buffer, file.type);

  const document = await db.document.create({
    data: {
      name: file.name,
      mimeType: file.type,
      size: file.size,
      content,
      projectId,
    },
  });

  // Index chunks asynchronously (fire & forget for fast response)
  indexDocument(document.id, content).catch(console.error);

  return NextResponse.json(
    { ...document, _count: { chunks: 0 } },
    { status: 201 }
  );
}
