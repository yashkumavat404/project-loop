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

    // Get feedback from the last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Create all 7 days first so days with zero feedback are included
    const trendMap = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      trendMap.set(label, 0);
    }

    // Count feedback for each day
    for (const item of feedback) {
      const label = item.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (trendMap.has(label)) {
        trendMap.set(label, (trendMap.get(label) ?? 0) + 1);
      }
    }

    const result = Array.from(trendMap.entries()).map(
      ([label, value]) => ({
        label,
        value,
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/analytics/volume error:", error);

    return NextResponse.json(
      {
        message: "Failed to load feedback volume.",
      },
      { status: 500 }
    );
  }
}