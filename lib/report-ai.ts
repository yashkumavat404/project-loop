import OpenAI from "openai";

export interface ReportAIInput {
  periodStart: string;
  periodEnd: string;
  totalFeedback: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  actionedCount: number;
  topThemes: Array<{
    name: string;
    count: number;
  }>;
}

export interface ReportAIResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is not configured.");
}

const groq = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function generateReportAI(
  input: ReportAIInput
): Promise<ReportAIResult> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
    reasoning_effort: "low",
    max_completion_tokens: 2048,

    response_format: {
      type: "json_schema",
      json_schema: {
        name: "loop_voice_of_customer_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            insights: {
              type: "array",
              items: {
                type: "string",
              },
            },
            recommendations: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["summary", "insights", "recommendations"],
          additionalProperties: false,
        },
      },
    },

    messages: [
      {
        role: "system",
        content:
          "You are LOOP, an AI customer feedback intelligence assistant. " +
          "Generate a concise Voice of Customer report from the verified statistics provided. " +
          "Use ONLY the supplied statistics and themes. " +
          "Do not invent customer feedback, numbers, causes, or facts. " +
          "Do not claim information that is not supported by the supplied data. " +
          "The summary should describe the overall feedback picture. " +
          "Insights should identify meaningful patterns directly supported by the statistics. " +
          "Recommendations must be practical actions based only on the supplied evidence. " +
          "Return only the required JSON fields.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq returned an empty report response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("Groq returned invalid report JSON:", content);
    throw new Error("Groq returned an invalid report response.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("summary" in parsed) ||
    !("insights" in parsed) ||
    !("recommendations" in parsed)
  ) {
    throw new Error("Groq report response has an invalid structure.");
  }

  const result = parsed as {
    summary: unknown;
    insights: unknown;
    recommendations: unknown;
  };

  if (
    typeof result.summary !== "string" ||
    !Array.isArray(result.insights) ||
    !Array.isArray(result.recommendations) ||
    !result.insights.every((item) => typeof item === "string") ||
    !result.recommendations.every((item) => typeof item === "string")
  ) {
    throw new Error("Groq report response failed validation.");
  }

  return {
    summary: result.summary.trim(),
    insights: result.insights.map((item) => item.trim()),
    recommendations: result.recommendations.map((item) => item.trim()),
  };
}