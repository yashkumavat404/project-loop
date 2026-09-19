import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", MODEL_NAME);
  }

  return extractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanedText = text.trim();

  if (!cleanedText) {
    throw new Error("Text is required to generate an embedding.");
  }

  const model = await getExtractor();

  const output = await model(cleanedText, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}