import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: {
    id: string;
  };
};

function formatFeedback(item: {
  id: string;
  workspaceId: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  sentimentScore: number | null;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  createdAt: Date;
  feedbackThemes: Array<{
    theme: {
      id: string;
      name: string;
    };
  }>;
}) {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    text: item.content,
    customerName: item.customerLabel,
    customerEmail: null,
    channel: item.channel,
    status: item.status,
    sentiment: item.sentiment,
    sentimentScore: item.sentimentScore,
    score: item.sentimentScore,
    featureArea: null,
    themes: item.feedbackThemes.map((relation) => ({
      id: relation.theme.id,
      name: relation.theme.name,
    })),
    createdAt: item.createdAt.toISOString(),
  };
}

/**
 * GET /api/feedback/[id]
 *
 * Fetch one feedback item belonging to the
 * authenticated user's workspace.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const feedback = await prisma.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(formatFeedback(feedback));
  } catch (error) {
    console.error("GET /api/feedback/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback/[id]
 *
 * Only ADMIN and ANALYST users can update feedback status.
 * VIEWER users are read-only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ADMIN and ANALYST users can update feedback.
    // VIEWER users are read-only.
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ANALYST"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const status = body?.status;

    const allowedStatuses = [
      "NEW",
      "REVIEWED",
      "ACTIONED",
    ] as const;

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Allowed values are NEW, REVIEWED, and ACTIONED.",
        },
        { status: 400 }
      );
    }

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: {
        id: existingFeedback.id,
      },
      data: {
        status: status as "NEW" | "REVIEWED" | "ACTIONED",
      },
      include: {
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    return NextResponse.json(formatFeedback(updatedFeedback));
  } catch (error) {
    console.error("PATCH /api/feedback/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}