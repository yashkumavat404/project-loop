"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "next-auth/react";

import { api } from "@/lib/api";
import { demoFeedback } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import type { Feedback, FeedbackStatus, Role } from "@/lib/types";

export default function FeedbackDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(
    demoFeedback.find((item) => item.id === params.id) ||
      demoFeedback[0]
  );

  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function loadSession() {
      const session = await getSession();

      const sessionRole = session?.user?.role as Role | undefined;

      if (sessionRole) {
        setRole(sessionRole);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    api
      .getFeedbackById(params.id)
      .then(setFeedback)
      .catch(() => {
        // Keep demo fallback.
      });
  }, [params.id]);

  async function updateStatus(status: FeedbackStatus) {
    if (!feedback || role === "VIEWER") {
      return;
    }

    try {
      setSaving(true);

      const updated = await api.updateFeedback(
        feedback.id,
        { status }
      );

      setFeedback(updated);
    } catch (error) {
      console.error(
        "Failed to update feedback status:",
        error
      );
    } finally {
      setSaving(false);
    }
  }

  if (!feedback) {
    return <div className="p-8">Feedback not found.</div>;
  }

  const themes = (feedback.themes || []).map((theme) =>
    typeof theme === "string" ? theme : theme.name
  );

  const canUpdateStatus =
    role === "ADMIN" || role === "ANALYST";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/inbox"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to inbox
      </Link>

      <section className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted">Customer</p>

            <h1 className="text-2xl font-bold">
              {feedback.customerName || "Anonymous customer"}
            </h1>

            {feedback.customerEmail && (
              <p className="mt-1 text-sm text-muted">
                {feedback.customerEmail}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{feedback.channel}</Badge>
            <Badge>{feedback.status}</Badge>

            <Badge
              tone={
                feedback.sentiment === "NEGATIVE"
                  ? "negative"
                  : feedback.sentiment === "POSITIVE"
                    ? "positive"
                    : "neutral"
              }
            >
              {feedback.sentiment || "UNCLASSIFIED"}
            </Badge>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Feedback
          </p>

          <p className="mt-2 text-base leading-7 text-slate-700">
            {feedback.text}
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Feature area
            </p>

            <p className="mt-1 text-sm">
              {feedback.featureArea || "Not classified"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Themes
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {themes.length ? (
                themes.map((theme) => (
                  <Badge key={theme}>{theme}</Badge>
                ))
              ) : (
                <span className="text-sm text-muted">
                  None yet
                </span>
              )}
            </div>
          </div>
        </div>

        {canUpdateStatus && (
          <div className="mt-8 border-t border-line pt-5">
            <p className="mb-3 text-sm font-semibold">
              Update status
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                ["NEW", "REVIEWED", "ACTIONED"] as FeedbackStatus[]
              ).map((status) => (
                <button
                  key={status}
                  disabled={saving}
                  className={
                    feedback.status === status
                      ? "btn-primary"
                      : "btn-secondary"
                  }
                  onClick={() => updateStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        {role === "VIEWER" && (
          <div className="mt-8 border-t border-line pt-5">
            <p className="text-sm text-muted">
              Viewer access is read-only. Feedback status can only
              be updated by an Admin or Analyst.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}