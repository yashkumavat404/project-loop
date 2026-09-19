import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReportAI } from "@/lib/report-ai";

const createReportSchema = z
  .object({
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
  })
  .refine((data) => data.periodStart < data.periodEnd, {
    message: "periodStart must be before periodEnd.",
    path: ["periodEnd"],
  });

function mapReport(report: {
  id: string;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  contentJson: unknown;
  createdAt: Date;
}) {
  const content =
    typeof report.contentJson === "object" &&
    report.contentJson !== null
      ? (report.contentJson as {
          summary?: unknown;
          topThemes?: unknown;
          insights?: unknown;
          recommendations?: unknown;
          statistics?: unknown;
        })
      : {};

  const summary =
    typeof content.summary === "string"
      ? content.summary
      : "";

  const topThemes = Array.isArray(content.topThemes)
    ? content.topThemes.filter(
        (
          item
        ): item is { name: string; count: number } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { name?: unknown }).name === "string" &&
          typeof (item as { count?: unknown }).count === "number"
      )
    : [];

  const insights = Array.isArray(content.insights)
    ? content.insights.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  const recommendations = Array.isArray(content.recommendations)
    ? content.recommendations.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  return {
    id: report.id,
    title: report.title,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    summary,
    topThemes,
    insights,
    recommendations,
    createdAt: report.createdAt.toISOString(),
  };
}

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

    const reports = await prisma.report.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      reports.map((report) => ({
        ...mapReport(report),
        workspaceId: report.workspaceId,
        generatedBy: report.generatedBy,
        generator: report.generator,
      }))
    );
  } catch (error) {
    console.error("GET /api/reports error:", error);

    return NextResponse.json(
      { message: "Failed to fetch reports." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ANALYST"
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const generatedBy = session.user.id;

    const body = await request.json();

    const validation = createReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid report data.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { periodStart, periodEnd } = validation.data;

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        sentiment: true,
        status: true,
        feedbackThemes: {
          select: {
            themeId: true,
            theme: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const totalFeedback = feedback.length;

    const positiveCount = feedback.filter(
      (item) => item.sentiment === "POSITIVE"
    ).length;

    const neutralCount = feedback.filter(
      (item) => item.sentiment === "NEUTRAL"
    ).length;

    const negativeCount = feedback.filter(
      (item) => item.sentiment === "NEGATIVE"
    ).length;

    const actionedCount = feedback.filter(
      (item) => item.status === "ACTIONED"
    ).length;

    const themeCounts = new Map<string, number>();

    for (const item of feedback) {
      for (const feedbackTheme of item.feedbackThemes) {
        const themeName = feedbackTheme.theme.name;

        themeCounts.set(
          themeName,
          (themeCounts.get(themeName) ?? 0) + 1
        );
      }
    }

    const topThemes = Array.from(themeCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const reportAI = await generateReportAI({
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalFeedback,
      positiveCount,
      neutralCount,
      negativeCount,
      actionedCount,
      topThemes,
    });

    const title = "Voice of Customer Report";

    const contentJson = {
      summary: reportAI.summary,
      insights: reportAI.insights,
      recommendations: reportAI.recommendations,
      topThemes,
      statistics: {
        totalFeedback,
        positiveCount,
        neutralCount,
        negativeCount,
        actionedCount,
      },
      generatedBy,
      aiProvider: "groq",
      aiModel: "openai/gpt-oss-20b",
    };

    const report = await prisma.report.create({
      data: {
        title,
        periodStart,
        periodEnd,
        contentJson,
        workspaceId,
        generatedBy,
      },
    });

    return NextResponse.json(
      mapReport(report),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reports error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create report.";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}