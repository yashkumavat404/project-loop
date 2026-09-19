import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyFeedback } from "@/lib/feedback-ai";
import { storeFeedbackEmbedding } from "@/lib/embedding-store";

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
    const pageSizeParam = Number(
      searchParams.get("pageSize") || "20"
    );

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
    const sentiment =
      searchParams.get("sentiment")?.trim() || "";
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
            status: status as
              | "NEW"
              | "REVIEWED"
              | "ACTIONED",
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

    const totalPages = Math.max(
      1,
      Math.ceil(total / pageSize)
    );

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

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;

    const text =
      typeof requestBody.text === "string"
        ? requestBody.text.trim()
        : "";

    const customerName =
      typeof requestBody.customerName === "string"
        ? requestBody.customerName.trim()
        : "";

    const customerEmail =
      typeof requestBody.customerEmail === "string"
        ? requestBody.customerEmail.trim()
        : "";

    const channel =
      typeof requestBody.channel === "string"
        ? requestBody.channel.trim().toUpperCase()
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

    /*
     * Get only themes belonging to the authenticated workspace.
     */
    const workspaceThemes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const themeNames = workspaceThemes.map(
      (theme) => theme.name
    );

    /*
     * Classify feedback using Groq.
     */
    const classification = await classifyFeedback(
      text,
      themeNames
    );

    /*
     * Map AI theme names to actual workspace Theme IDs.
     */
    const themeMap = new Map(
      workspaceThemes.map((theme) => [
        theme.name,
        theme.id,
      ])
    );

    const themeRelations = classification.themes
      .map((theme) => {
        const themeId = themeMap.get(theme.name);

        if (!themeId) {
          return null;
        }

        return {
          themeId,
          confidence: theme.confidence,
        };
      })
      .filter(
        (
          relation
        ): relation is {
          themeId: string;
          confidence: number;
        } => relation !== null
      );

    /*
     * Create the feedback and theme relationships atomically.
     */
    const feedback = await prisma.$transaction(
      async (transaction) => {
        return transaction.feedback.create({
          data: {
            content: text,
            customerLabel: customerName || null,
            channel,
            workspaceId,
            status: "NEW",
            sentiment: classification.sentiment,
            sentimentScore:
              classification.sentimentScore,

            feedbackThemes:
              themeRelations.length > 0
                ? {
                    create: themeRelations.map(
                      (relation) => ({
                        theme: {
                          connect: {
                            id: relation.themeId,
                          },
                        },
                        confidence:
                          relation.confidence,
                      })
                    ),
                  }
                : undefined,
          },

          include: {
            feedbackThemes: {
              include: {
                theme: true,
              },
            },
          },
        });
      }
    );

    /*
     * Generate and store the semantic embedding.
     *
     * If embedding generation fails, the feedback itself
     * remains safely stored. It can be embedded later by
     * the backfill script.
     */
    let embeddingStatus: "READY" | "PENDING" = "READY";

    try {
      await storeFeedbackEmbedding(
        feedback.id,
        workspaceId
      );
    } catch (embeddingError) {
      embeddingStatus = "PENDING";

      console.error(
        "Failed to generate feedback embedding:",
        embeddingError
      );
    }

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
      themes: feedback.feedbackThemes.map(
        (relation) => ({
          id: relation.theme.id,
          name: relation.theme.name,
        })
      ),
      embeddingStatus,
      createdAt: feedback.createdAt.toISOString(),
    };

    return NextResponse.json(response, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/feedback error:", error);

    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}