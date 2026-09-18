import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createThemeSchema = z.object({
  name: z.string().trim().min(1, "Theme name is required.").max(100),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less.")
    .optional(),
  color: z
    .string()
    .trim()
    .max(50, "Color must be 50 characters or less.")
    .optional(),
});

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

    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            feedbackThemes: true,
          },
        },
      },
    });

    return NextResponse.json(
      themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        count: theme._count.feedbackThemes,
        workspaceId: theme.workspaceId,
      }))
    );
  } catch (error) {
    console.error("GET /api/themes error:", error);

    return NextResponse.json(
      { message: "Failed to fetch themes." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
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

    const body = await request.json();

    const result = createThemeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid theme data.",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, description, color } = result.data;

    const existingTheme = await prisma.theme.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
    });

    if (existingTheme) {
      return NextResponse.json(
        { message: "A theme with this name already exists." },
        { status: 409 }
      );
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        workspaceId,
      },
    });

    return NextResponse.json(
      {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        count: 0,
        workspaceId: theme.workspaceId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/themes error:", error);

    return NextResponse.json(
      { message: "Failed to create theme." },
      { status: 500 }
    );
  }
}