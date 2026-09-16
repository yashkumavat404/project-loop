import OpenAI from "openai";

export interface AIResult {
  answer: string;
  sourceIds: string[];
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is not configured.");
}

const groq = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function askAI(
  question: string,
  context: string
): Promise<AIResult> {
  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      temperature: 0.2,

      max_completion_tokens: 1024,

      response_format: {
        type: "json_schema",
        json_schema: {
          name: "loop_feedback_answer",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: {
                type: "string",
              },
              sourceIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["answer", "sourceIds"],
            additionalProperties: false,
          },
        },
      },

      messages: [
        {
          role: "system",
          content:
            "You are LOOP, an AI customer feedback intelligence assistant. " +
            "Answer the user's question using ONLY the customer feedback context provided. " +
            "Do not use outside knowledge. Do not invent information. " +
            "Identify only feedback IDs that directly support the answer. " +
            "Keep the answer concise and focused. " +
            "If there is no relevant feedback, clearly say so and return an empty sourceIds array.",
        },
        {
          role: "user",
          content:
            `Customer feedback context:\n\n${context}\n\n` +
            `Question:\n${question}`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("Groq response:", response);

      throw new Error("Groq returned an empty response.");
    }

    let parsed: AIResult;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("Groq returned invalid JSON:", content);

      throw new Error("Groq returned an invalid AI response.");
    }

    if (
      typeof parsed.answer !== "string" ||
      !Array.isArray(parsed.sourceIds)
    ) {
      console.error("Invalid Groq structure:", parsed);

      throw new Error("Groq response has an invalid structure.");
    }

    return {
      answer: parsed.answer.trim(),
      sourceIds: parsed.sourceIds.filter(
        (id): id is string => typeof id === "string"
      ),
    };
  } catch (error: any) {
    console.error("Groq AI error:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    throw error;
  }
}