import "dotenv/config";

import { Pool } from "pg";

import { storeFeedbackEmbedding } from "../lib/embedding-store";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main() {
  console.log("Finding a feedback record...");

  const feedbackResult = await pool.query<{
    id: string;
    content: string;
    workspaceId: string;
  }>(
    `
      SELECT
        id,
        content,
        "workspaceId"
      FROM "Feedback"
      ORDER BY "createdAt" DESC
      LIMIT 1
    `
  );

  const feedback = feedbackResult.rows[0];

  if (!feedback) {
    throw new Error("No feedback records found.");
  }

  console.log("Feedback found:");
  console.log("ID:", feedback.id);
  console.log("Workspace ID:", feedback.workspaceId);
  console.log("Content:", feedback.content);

  console.log("");
  console.log("Generating and storing embedding...");

  await storeFeedbackEmbedding(
    feedback.id,
    feedback.workspaceId
  );

  console.log("Embedding stored successfully.");

  const embeddingResult = await pool.query<{
    id: string;
    feedbackId: string;
    dimensions: number;
  }>(
    `
      SELECT
        id,
        "feedbackId",
        vector_dims(vector) AS dimensions
      FROM "Embedding"
      WHERE "feedbackId" = $1
      LIMIT 1
    `,
    [feedback.id]
  );

  const embedding = embeddingResult.rows[0];

  if (!embedding) {
    throw new Error(
      "Embedding was not found after storing it."
    );
  }

  console.log("");
  console.log("Embedding verification:");
  console.log("Embedding ID:", embedding.id);
  console.log("Feedback ID:", embedding.feedbackId);
  console.log("Vector dimensions:", embedding.dimensions);

  if (embedding.dimensions !== 384) {
    throw new Error(
      `Expected 384 dimensions, but found ${embedding.dimensions}.`
    );
  }

  console.log("");
  console.log("Embedding storage test passed.");
}

main()
  .catch((error) => {
    console.error(
      "Embedding storage test failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });