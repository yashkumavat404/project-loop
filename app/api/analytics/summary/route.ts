import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const [
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      newThisWeek,
      resolvedFeedback,
    ] = await Promise.all([
      prisma.feedback.count({
        where: {
          workspaceId,
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "POSITIVE",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "NEGATIVE",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          createdAt: {
            gte: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ),
          },
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "ACTIONED",
        },
      }),
    ]);

    const positivePercent =
      totalFeedback > 0
        ? Math.round((positiveFeedback / totalFeedback) * 100)
        : 0;

    const negativePercent =
      totalFeedback > 0
        ? Math.round((negativeFeedback / totalFeedback) * 100)
        : 0;

    const resolvedPercent =
      totalFeedback > 0
        ? Math.round((resolvedFeedback / totalFeedback) * 100)
        : 0;

    return NextResponse.json({
      totalFeedback,
      positivePercent,
      negativePercent,
      newThisWeek,
      resolvedPercent,
    });
  } catch (error) {
    console.error("GET /api/analytics/summary error:", error);

    return NextResponse.json(
      {
        message: "Failed to load analytics summary.",
      },
      { status: 500 }
    );
  }
}