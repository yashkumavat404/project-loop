import { Pool } from "pg";

import { generateEmbedding } from "./embeddings";

export interface VectorSearchResult {
  id: string;
  content: string;
  customerLabel: string | null;
  channel: string;
  sentiment: string | null;
  status: string;
  createdAt: string;
  similarity: number;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export async function searchSimilarFeedback(
  question: string,
  workspaceId: string,
  limit = 10
): Promise<VectorSearchResult[]> {
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    throw new Error("Question is required for semantic search.");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required for semantic search.");
  }

  const safeLimit = Math.min(
    Math.max(Math.floor(limit), 1),
    20
  );

  /*
   * Retrieve more candidates than the final limit.
   *
   * This is important because duplicate feedback records can otherwise
   * occupy the entire top-K result set.
   */
  const candidateLimit = Math.min(
    Math.max(safeLimit * 5, 20),
    100
  );

  const questionEmbedding = await generateEmbedding(cleanedQuestion);

  const vector = `[${questionEmbedding.join(",")}]`;

  const result = await pool.query<{
    id: string;
    content: string;
    customerLabel: string | null;
    channel: string;
    sentiment: string | null;
    status: string;
    createdAt: Date;
    distance: number;
  }>(
    `
      SELECT
        f.id,
        f.content,
        f."customerLabel",
        f.channel,
        f.sentiment,
        f.status,
        f."createdAt",
        e.vector <=> $1::vector AS distance
      FROM "Feedback" f
      INNER JOIN "Embedding" e
        ON e."feedbackId" = f.id
      WHERE f."workspaceId" = $2
      ORDER BY e.vector <=> $1::vector
      LIMIT $3
    `,
    [vector, workspaceId, candidateLimit]
  );

  /*
   * Remove duplicate feedback content.
   *
   * The seed/test data contains identical feedback text across
   * different channels. Keeping every duplicate can cause the
   * same feedback statement to dominate the RAG context.
   *
   * We normalize whitespace and casing so small formatting
   * differences do not bypass duplicate detection.
   */
  const uniqueResults: VectorSearchResult[] = [];
  const seenContent = new Set<string>();

  for (const row of result.rows) {
    const normalizedContent = row.content
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    if (seenContent.has(normalizedContent)) {
      continue;
    }

    seenContent.add(normalizedContent);

    uniqueResults.push({
      id: row.id,
      content: row.content,
      customerLabel: row.customerLabel,
      channel: row.channel,
      sentiment: row.sentiment,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      similarity: 1 - row.distance,
    });

    if (uniqueResults.length >= safeLimit) {
      break;
    }
  }

  return uniqueResults;
}