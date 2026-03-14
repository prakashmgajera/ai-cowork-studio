/**
 * RAG (Retrieval-Augmented Generation) utilities.
 *
 * Documents are parsed on upload, split into chunks, and stored in the database.
 * At query time, relevant chunks are retrieved via keyword scoring and injected
 * into the Claude system prompt as context.
 */

import { db } from "@/lib/db";
import { chunkText, scoreChunkRelevance } from "@/lib/utils";

// ── Document Parsing ──────────────────────────────────────────────────────────

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported document type: ${mimeType}`);
}

// ── Indexing ──────────────────────────────────────────────────────────────────

export async function indexDocument(documentId: string, content: string) {
  const chunks = chunkText(content, 1000, 200);

  await db.documentChunk.deleteMany({ where: { documentId } });

  await db.documentChunk.createMany({
    data: chunks.map((chunk, index) => ({
      documentId,
      content: chunk,
      chunkIndex: index,
    })),
  });
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

export async function retrieveRelevantContext(
  projectId: string,
  query: string,
  topK = 5
): Promise<string> {
  const chunks = await db.documentChunk.findMany({
    where: {
      document: { projectId },
    },
    include: {
      document: { select: { name: true } },
    },
    take: 500, // Limit total chunks to avoid memory issues
  });

  if (chunks.length === 0) return "";

  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunkRelevance(chunk.content, query),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) return "";

  return scored
    .map((c) => `[From: ${c.document.name}]\n${c.content}`)
    .join("\n\n---\n\n");
}
