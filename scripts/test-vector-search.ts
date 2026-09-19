import "dotenv/config";

import { Pool } from "pg";

import { searchSimilarFeedback } from "../lib/vector-search";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main() {
  console.log("Checking embedding data...");

  const feedbackResult = await pool.query<{
    id: string;
    content: string;
    workspaceId: string;
  }>(
    `
      SELECT
        f.id,
        f.content,
        f."workspaceId"
      FROM "Feedback" f
      INNER JOIN "Embedding" e
        ON e."feedbackId" = f.id
      ORDER BY f."createdAt" DESC
      LIMIT 1
    `
  );

  const feedback = feedbackResult.rows[0];

  if (!feedback) {
    throw new Error(
      "No feedback record with an embedding was found."
    );
  }

  console.log("Embedded feedback found.");
  console.log("Feedback ID:", feedback.id);
  console.log("Workspace ID:", feedback.workspaceId);
  console.log("Content:", feedback.content);

  const embeddingCountResult = await pool.query<{
    count: string;
  }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "Embedding"
    `
  );

  console.log(
    "Total stored embeddings:",
    embeddingCountResult.rows[0].count
  );

  const question =
    "What problems are customers experiencing with the mobile app?";

  console.log("");
  console.log("Running semantic search...");
  console.log("Question:", question);

  const results = await searchSimilarFeedback(
    question,
    feedback.workspaceId,
    20
  );

  console.log("");
  console.log(`Found ${results.length} relevant feedback records.`);
  console.log("");

  results.forEach((result, index) => {
    console.log(`Result ${index + 1}`);
    console.log("ID:", result.id);
    console.log("Similarity:", result.similarity);
    console.log("Channel:", result.channel);
    console.log("Sentiment:", result.sentiment);
    console.log("Content:", result.content);
    console.log("----------------------------------------");
  });

  if (results.length === 0) {
    throw new Error(
      "The workspace has an embedding, but vector search returned no results."
    );
  }

  console.log("Vector search test passed.");
}

main()
  .catch((error) => {
    console.error("Vector search test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });