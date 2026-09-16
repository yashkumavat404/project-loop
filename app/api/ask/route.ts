import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { askAI } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const body = await request.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        { message: "Question is required." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        content: true,
        customerLabel: true,
        channel: true,
        sentiment: true,
        status: true,
        createdAt: true,
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json({
        answer:
          "There is not enough customer feedback in the current workspace to answer this question.",
        sources: [],
      });
    }

    /*
     * Build the feedback context that will be sent to the AI.
     */
    const context = feedback
      .map(
        (item, index) =>
          `Feedback ${index + 1}
ID: ${item.id}
Customer: ${item.customerLabel || "Unknown"}
Channel: ${item.channel}
Sentiment: ${item.sentiment || "Unknown"}
Status: ${item.status}
Date: ${item.createdAt.toISOString()}
Feedback: ${item.content}`
      )
      .join("\n\n---\n\n");

    /*
     * askAI() returns an AIResult object.
     *
     * Expected structure:
     * {
     *   answer: string,
     *   sourceIds: string[]
     * }
     */
    const aiResult = await askAI(question, context);

    /*
     * Get the exact feedback records selected by the AI.
     */
    const relevantFeedback = feedback.filter((item) =>
      Array.isArray(aiResult.sourceIds)
        ? aiResult.sourceIds.includes(item.id)
        : false
    );

    /*
     * Convert the selected feedback into the source format
     * expected by the frontend.
     */
    const sources = relevantFeedback.map((item) => ({
      id: item.id,
      text: item.content,
      channel: item.channel,
      sentiment: item.sentiment,
      createdAt: item.createdAt.toISOString(),
    }));

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
        error: String(error),
      },
      { status: 500 }
    );
  }
}