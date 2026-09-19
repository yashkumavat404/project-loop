import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { askAI } from "@/lib/ai";
import {
  searchSimilarFeedback,
  type VectorSearchResult,
} from "@/lib/vector-search";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get the authenticated user's workspace
    const workspaceId = session.user.workspaceId;

    // 3. Validate the request body
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("question" in body) ||
      typeof body.question !== "string"
    ) {
      return NextResponse.json(
        { message: "Question is required." },
        { status: 400 }
      );
    }

    const question = body.question.trim();

    if (!question) {
      return NextResponse.json(
        { message: "Question is required." },
        { status: 400 }
      );
    }

    // 4. Retrieve semantically relevant feedback.
    //
    // The vector search is workspace-scoped internally, so feedback
    // from another tenant cannot enter the AI context.
    const relevantFeedback = await searchSimilarFeedback(
      question,
      workspaceId,
      10
    );

    // 5. Handle a workspace with no indexed feedback
    if (relevantFeedback.length === 0) {
      return NextResponse.json({
        answer:
          "There is not enough indexed customer feedback in the current workspace to answer this question.",
        sources: [],
      });
    }

    // 6. Build grounded context for the AI model
    const context = relevantFeedback
      .map(
        (item: VectorSearchResult, index: number) =>
          `Feedback ${index + 1}
ID: ${item.id}
Customer: ${item.customerLabel || "Unknown"}
Channel: ${item.channel}
Sentiment: ${item.sentiment || "Unknown"}
Status: ${item.status}
Similarity: ${item.similarity.toFixed(3)}
Date: ${item.createdAt}
Feedback: ${item.content}`
      )
      .join("\n\n---\n\n");

    // 7. Ask Groq using ONLY the retrieved feedback context
    const aiResult = await askAI(question, context);

    // 8. Security check:
    //    Only allow source IDs that actually came from the
    //    workspace-scoped retrieval results.
    const retrievedIds = new Set(
      relevantFeedback.map((item) => item.id)
    );

    const validSourceIds = aiResult.sourceIds.filter((id) =>
      retrievedIds.has(id)
    );

    // 9. Build the sources returned to the frontend.
    const sources = relevantFeedback
      .filter((item) => validSourceIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        text: item.content,
        channel: item.channel,
        sentiment: item.sentiment,
        createdAt: item.createdAt,
      }));

    // 10. Return the grounded answer and supporting sources
    return NextResponse.json({
      answer: aiResult.answer,
      sources,
    });
  } catch (error) {
    console.error("POST /api/ask error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error occurred while processing Ask LOOP request.";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 }
    );
  }
}