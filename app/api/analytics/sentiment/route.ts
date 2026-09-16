import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get the latest 7 days of feedback
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const feedback = await prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        sentiment: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        sentiment: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Create the last 7 days
    const days: {
      label: string;
      positive: number;
      neutral: number;
      negative: number;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      days.push({
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }

    // Add feedback to the correct day
    for (const item of feedback) {
      const itemDate = new Date(item.createdAt);

      const index = Math.floor(
        (itemDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (index < 0 || index >= 7) {
        continue;
      }

      if (item.sentiment === "POSITIVE") {
        days[index].positive++;
      } else if (item.sentiment === "NEUTRAL") {
        days[index].neutral++;
      } else if (item.sentiment === "NEGATIVE") {
        days[index].negative++;
      }
    }

    return NextResponse.json(days);
  } catch (error) {
    console.error("Analytics sentiment error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch sentiment analytics",
      },
      { status: 500 }
    );
  }
}