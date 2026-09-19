import "dotenv/config";

import { Pool } from "pg";

import { generateEmbedding } from "./embeddings";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export async function storeFeedbackEmbedding(
  feedbackId: string,
  workspaceId: string
): Promise<void> {
  if (!feedbackId) {
    throw new Error("Feedback ID is required.");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }

  const feedbackResult = await pool.query<{
    id: string;
    content: string;
  }>(
    `
      SELECT
        id,
        content
      FROM "Feedback"
      WHERE id = $1
        AND "workspaceId" = $2
      LIMIT 1
    `,
    [feedbackId, workspaceId]
  );

  const feedback = feedbackResult.rows[0];

  if (!feedback) {
    throw new Error(
      "Feedback not found in the authenticated workspace."
    );
  }

  const embedding = await generateEmbedding(
    feedback.content
  );

  const vector = `[${embedding.join(",")}]`;

  await pool.query(
    `
      INSERT INTO "Embedding" ("id", "feedbackId", "vector")
      VALUES (gen_random_uuid()::text, $1, $2::vector)
      ON CONFLICT ("feedbackId")
      DO UPDATE SET "vector" = EXCLUDED."vector"
    `,
    [feedback.id, vector]
  );
}