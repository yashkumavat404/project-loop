import "dotenv/config";

import { Pool } from "pg";

import { classifyFeedback } from "../lib/feedback-ai";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main() {
  console.log("Checking workspace themes...");

  const workspaceResult = await pool.query<{
    id: string;
    name: string;
  }>(
    `
      SELECT
        id,
        name
      FROM "Workspace"
      ORDER BY "createdAt" ASC
      LIMIT 1
    `
  );

  const workspace = workspaceResult.rows[0];

  if (!workspace) {
    throw new Error("No workspace was found.");
  }

  console.log("Workspace:", workspace.name);
  console.log("Workspace ID:", workspace.id);

  const themeResult = await pool.query<{
    name: string;
  }>(
    `
      SELECT
        name
      FROM "Theme"
      WHERE "workspaceId" = $1
      ORDER BY name ASC
    `,
    [workspace.id]
  );

  const themeNames = themeResult.rows.map((theme) => theme.name);

  console.log("");
  console.log("Existing workspace themes:");

  themeNames.forEach((theme, index) => {
    console.log(`${index + 1}. ${theme}`);
  });

  const feedback =
    "The mobile app freezes whenever I open the order history.";

  console.log("");
  console.log("Testing AI classification...");
  console.log("Feedback:", feedback);

  const result = await classifyFeedback(
    feedback,
    themeNames
  );

  console.log("");
  console.log("AI classification result:");
  console.log(
    JSON.stringify(result, null, 2)
  );

  if (!result.sentiment) {
    throw new Error("Sentiment was not returned.");
  }

  if (
    typeof result.sentimentScore !== "number"
  ) {
    throw new Error(
      "Sentiment score was not returned."
    );
  }

  if (!Array.isArray(result.themes)) {
    throw new Error(
      "Themes were not returned as an array."
    );
  }

  const invalidThemes = result.themes.filter(
    (theme) => !themeNames.includes(theme.name)
  );

  if (invalidThemes.length > 0) {
    throw new Error(
      `AI returned themes that do not exist in the workspace: ${invalidThemes
        .map((theme) => theme.name)
        .join(", ")}`
    );
  }

  console.log("");
  console.log("Feedback AI test passed.");
}

main()
  .catch((error) => {
    console.error(
      "Feedback AI test failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });