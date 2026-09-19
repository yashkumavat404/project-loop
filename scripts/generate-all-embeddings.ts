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
  console.log("Finding feedback without embeddings...");

  const feedbackResult = await pool.query<{
    id: string;
    workspaceId: string;
  }>(
    `
      SELECT
        f.id,
        f."workspaceId"
      FROM "Feedback" f
      LEFT JOIN "Embedding" e
        ON e."feedbackId" = f.id
      WHERE e."feedbackId" IS NULL
      ORDER BY f."createdAt" ASC
    `
  );

  console.log(
    `Found ${feedbackResult.rows.length} feedback records without embeddings.`
  );

  if (feedbackResult.rows.length === 0) {
    console.log("All feedback records already have embeddings.");
    return;
  }

  let completed = 0;

  for (const feedback of feedbackResult.rows) {
    await storeFeedbackEmbedding(
      feedback.id,
      feedback.workspaceId
    );

    completed += 1;

    console.log(
      `Embedding ${completed}/${feedbackResult.rows.length} stored.`
    );
  }

  console.log("");
  console.log(
    "All feedback embeddings generated successfully."
  );

  const countResult = await pool.query<{
    count: string;
  }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "Embedding"
    `
  );

  console.log(
    "Total stored embeddings:",
    countResult.rows[0].count
  );
}

main()
  .catch((error) => {
    console.error(
      "Embedding generation failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });