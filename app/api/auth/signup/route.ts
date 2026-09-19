import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  workspace: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters."),
  email: z.string().trim().toLowerCase().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message:
            validation.error.issues[0]?.message ||
            "Invalid signup details.",
        },
        { status: 400 }
      );
    }

    const { name, workspace, email, password } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: workspace,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
          workspaceId: createdWorkspace.id,
        },
      });

      return {
        workspace: createdWorkspace,
        user: createdUser,
      };
    });

    return NextResponse.json(
      {
        message: "Workspace created successfully.",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          workspaceId: result.user.workspaceId,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);

    return NextResponse.json(
      {
        message: "Unable to create workspace. Please try again.",
      },
      { status: 500 }
    );
  }
}