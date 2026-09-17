import type {
  AskResponse,
  DashboardStats,
  Feedback,
  PaginatedFeedback,
  Report,
  TrendPoint
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getDashboardStats: () =>
    request<DashboardStats>("/api/analytics/summary"),

  getFeedback: (params: URLSearchParams) =>
    request<PaginatedFeedback>(`/api/feedback?${params.toString()}`),

  getFeedbackById: (id: string) =>
    request<Feedback>(`/api/feedback/${id}`),

  updateFeedback: (id: string, data: Partial<Feedback>) =>
    request<Feedback>(`/api/feedback/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),

  getVolumeTrend: () =>
    request<TrendPoint[]>("/api/analytics/volume"),

  getSentimentTrend: () =>
    request<TrendPoint[]>("/api/analytics/sentiment"),

  askLoop: (question: string) =>
    request<AskResponse>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ question })
    }),

  getReports: () =>
    request<Report[]>("/api/reports"),

  createReport: (periodStart: string, periodEnd: string) =>
    request<Report>("/api/reports", {
      method: "POST",
      body: JSON.stringify({ periodStart, periodEnd })
    }),

  createFeedback: (data: {
    text: string;
    customerName?: string;
    customerEmail?: string;
    customerLabel?: string;
    createdAt?: string;
    channel: string;
  }) =>
    request<Feedback>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  importFeedbackCsv: (
    rows: Array<{ text: string; channel: string; customerLabel?: string; createdAt?: string }>
  ) =>
    request<{ imported: number; failed: number }>("/api/feedback/import", {
      method: "POST",
      body: JSON.stringify({ rows })
    })
};