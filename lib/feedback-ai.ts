import OpenAI from "openai";
import { z } from "zod";

const feedbackAIResultSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(
    z.object({
      name: z.string().min(1),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export type FeedbackAIResult = z.infer<
  typeof feedbackAIResultSchema
>;

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is not configured.");
}

const groq = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function classifyFeedback(
  content: string,
  existingThemeNames: string[]
): Promise<FeedbackAIResult> {
  const cleanedContent = content.trim();

  if (!cleanedContent) {
    throw new Error("Feedback content is required for AI classification.");
  }

  const uniqueThemeNames = Array.from(
    new Set(
      existingThemeNames
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );

  const themeList =
    uniqueThemeNames.length > 0
      ? uniqueThemeNames.join(", ")
      : "No existing themes are available.";

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.1,
    reasoning_effort: "low",
    max_completion_tokens: 1024,

    response_format: {
      type: "json_schema",
      json_schema: {
        name: "loop_feedback_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"],
            },
            sentimentScore: {
              type: "number",
              minimum: -1,
              maximum: 1,
            },
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                },
                required: ["name", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "sentiment",
            "sentimentScore",
            "themes",
          ],
          additionalProperties: false,
        },
      },
    },

    messages: [
      {
        role: "system",
        content:
          "You are LOOP, an AI customer feedback classifier. " +
          "Classify the supplied customer feedback using only the feedback text. " +
          "Determine whether the sentiment is POSITIVE, NEUTRAL, or NEGATIVE. " +
          "Return a sentimentScore between -1 and 1, where negative values represent negative sentiment, " +
          "positive values represent positive sentiment, and values near zero represent neutral sentiment. " +
          "For themes, use ONLY the existing workspace theme names supplied below. " +
          "Do not invent new theme names. " +
          "Select only themes that are supported by the feedback text. " +
          "Confidence must be between 0 and 1. " +
          "Return only the required JSON fields.\n\n" +
          `Existing workspace themes: ${themeList}`,
      },
      {
        role: "user",
        content:
          `Customer feedback:\n${cleanedContent}`,
      },
    ],
  });

  const responseContent =
    response.choices?.[0]?.message?.content?.trim();

  if (!responseContent) {
    throw new Error("Groq returned an empty classification response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(responseContent);
  } catch {
    console.error(
      "Groq returned invalid classification JSON:",
      responseContent
    );

    throw new Error(
      "Groq returned an invalid classification response."
    );
  }

  const validationResult =
    feedbackAIResultSchema.safeParse(parsed);

  if (!validationResult.success) {
    console.error(
      "Invalid feedback classification:",
      validationResult.error.flatten()
    );

    throw new Error(
      "Groq classification response failed validation."
    );
  }

  const validThemeNames = new Set(uniqueThemeNames);

  const themes = validationResult.data.themes
    .filter((theme) => validThemeNames.has(theme.name))
    .map((theme) => ({
      name: theme.name,
      confidence: theme.confidence,
    }));

  return {
    sentiment: validationResult.data.sentiment,
    sentimentScore: validationResult.data.sentimentScore,
    themes,
  };
}