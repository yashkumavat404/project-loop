import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const { searchParams } = new URL(request.url);

    const pageParam = Number(searchParams.get("page") || "1");
    const pageSizeParam = Number(searchParams.get("pageSize") || "20");

    const page =
      Number.isFinite(pageParam) && pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    const pageSize =
      Number.isFinite(pageSizeParam) &&
      pageSizeParam > 0 &&
      pageSizeParam <= 100
        ? Math.floor(pageSizeParam)
        : 20;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const sentiment = searchParams.get("sentiment")?.trim() || "";
    const channel = searchParams.get("channel")?.trim() || "";

    const where = {
      workspaceId,

      ...(search
        ? {
            OR: [
              {
                content: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerLabel: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status: status as "NEW" | "REVIEWED" | "ACTIONED",
          }
        : {}),

      ...(sentiment
        ? {
            sentiment: sentiment as
              | "POSITIVE"
              | "NEUTRAL"
              | "NEGATIVE",
          }
        : {}),

      ...(channel
        ? {
            channel: {
              equals: channel,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const total = await prisma.feedback.count({
      where,
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const safePage = Math.min(page, totalPages);

    const feedback = await prisma.feedback.findMany({
      where,

      include: {
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    const items = feedback.map((item) => ({
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
    }));

    return NextResponse.json({
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/feedback error:", error);

    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ADMIN and ANALYST users can create feedback.
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

    const workspaceId = session.user.workspaceId;

    const body = await request.json();

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    const customerName =
      typeof body.customerName === "string"
        ? body.customerName.trim()
        : "";

    const customerEmail =
      typeof body.customerEmail === "string"
        ? body.customerEmail.trim()
        : "";

    const channel =
      typeof body.channel === "string"
        ? body.channel.trim().toUpperCase()
        : "";

    if (!text) {
      return NextResponse.json(
        { error: "Feedback text is required." },
        { status: 400 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        { error: "Feedback channel is required." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        content: text,
        customerLabel: customerName || null,
        channel,
        workspaceId,
        status: "NEW",
      },

      include: {
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    const response = {
      id: feedback.id,
      workspaceId: feedback.workspaceId,
      text: feedback.content,
      customerName: feedback.customerLabel,
      customerEmail: customerEmail || null,
      channel: feedback.channel,
      status: feedback.status,
      sentiment: feedback.sentiment,
      sentimentScore: feedback.sentimentScore,
      score: feedback.sentimentScore,
      featureArea: null,
      themes: feedback.feedbackThemes.map((relation) => ({
        id: relation.theme.id,
        name: relation.theme.name,
      })),
      createdAt: feedback.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback error:", error);

    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}