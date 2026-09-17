import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const csvRowSchema = z.object({
  content: z.string().trim().min(1, "Feedback content is required."),
  customerLabel: z.string().trim().optional(),
  sourceRef: z.string().trim().optional(),
  sentiment: z
    .enum(["POSITIVE", "NEUTRAL", "NEGATIVE"])
    .optional(),
  sentimentScore: z.coerce.number().min(0).max(1).optional(),
  status: z
    .enum(["NEW", "REVIEWED", "ACTIONED"])
    .optional(),
  createdAt: z.string().trim().optional(),
});

function optionalValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseCreatedAt(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "CSV file is required." },
        { status: 400 }
      );
    }

    if (
      file.type !== "text/csv" &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      return NextResponse.json(
        { message: "Only CSV files are supported." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { message: "The CSV file is empty." },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    let records: Record<string, unknown>[];

    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as Record<string, unknown>[];
    } catch (error) {
      return NextResponse.json(
        {
          message: "Invalid CSV format.",
          error:
            error instanceof Error
              ? error.message
              : "CSV parsing failed.",
        },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { message: "The CSV file contains no data rows." },
        { status: 400 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const validRows: Array<{
      content: string;
      customerLabel?: string;
      sourceRef?: string;
      sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
      sentimentScore?: number;
      status?: "NEW" | "REVIEWED" | "ACTIONED";
      createdAt?: Date;
    }> = [];

    const errors: Array<{
      row: number;
      message: string;
    }> = [];

    records.forEach((record, index) => {
      const rowNumber = index + 2;

      const result = csvRowSchema.safeParse({
        content: record.content,
        customerLabel: optionalValue(record.customerLabel),
        sourceRef: optionalValue(record.sourceRef),
        sentiment: optionalValue(record.sentiment),
        sentimentScore: optionalValue(record.sentimentScore),
        status: optionalValue(record.status),
        createdAt: optionalValue(record.createdAt),
      });

      if (!result.success) {
        errors.push({
          row: rowNumber,
          message: result.error.issues
            .map((issue) => issue.message)
            .join("; "),
        });
        return;
      }

      const parsedCreatedAt = parseCreatedAt(result.data.createdAt);

      if (result.data.createdAt && !parsedCreatedAt) {
        errors.push({
          row: rowNumber,
          message: "Invalid createdAt date.",
        });
        return;
      }

      validRows.push({
        content: result.data.content,
        customerLabel: result.data.customerLabel,
        sourceRef: result.data.sourceRef,
        sentiment: result.data.sentiment,
        sentimentScore: result.data.sentimentScore,
        status: result.data.status,
        createdAt: parsedCreatedAt,
      });
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          message: "No valid feedback rows were found.",
          imported: 0,
          failed: errors.length,
          errors,
        },
        { status: 400 }
      );
    }

    const result = await prisma.feedback.createMany({
      data: validRows.map((row) => ({
        content: row.content,
        channel: "CSV",
        sourceRef: row.sourceRef,
        customerLabel: row.customerLabel,
        sentiment: row.sentiment,
        sentimentScore: row.sentimentScore,
        status: row.status ?? "NEW",
        createdAt: row.createdAt ?? new Date(),
        workspaceId,
      })),
    });

    return NextResponse.json(
      {
        message: "CSV imported successfully.",
        imported: result.count,
        failed: errors.length,
        totalRows: records.length,
        errors,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ingestion error:", error);

    return NextResponse.json(
      {
        message: "Failed to import CSV.",
      },
      { status: 500 }
    );
  }
}