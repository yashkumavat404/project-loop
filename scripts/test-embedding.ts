import { generateEmbedding } from "../lib/embeddings";

async function main() {
  const text =
    "The mobile app freezes whenever I open the order history.";

  console.log("Generating embedding...");

  const embedding = await generateEmbedding(text);

  console.log("Embedding generated successfully.");
  console.log("Vector dimensions:", embedding.length);
  console.log("First 5 values:", embedding.slice(0, 5));
}

main().catch((error) => {
  console.error("Embedding test failed:", error);
  process.exit(1);
});