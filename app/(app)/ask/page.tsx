"use client";

import { FormEvent, useState } from "react";
import { Bot, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import type { AskResponse } from "@/lib/types";

const suggestions = [
  "What are customers saying about onboarding?",
  "Which themes are becoming more negative?",
  "What should the product team prioritize?",
];

function formatSourceDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);

    try {
      const result = await api.askLoop(question.trim());

      console.log("Ask LOOP API response:", result);

      setAnswer(result);
    } catch (error: unknown) {
      console.error("Ask LOOP error:", error);

      let message =
        "An unknown error occurred while processing the request.";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (error && typeof error === "object") {
        try {
          const errorObject = error as {
            message?: unknown;
            error?: unknown;
          };

          if (typeof errorObject.message === "string") {
            message = errorObject.message;
          } else if (typeof errorObject.error === "string") {
            message = errorObject.error;
          }
        } catch {
          // Keep the default error message.
        }
      }

      setAnswer({
        answer: `Ask LOOP failed: ${message}`,
        sources: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Ask LOOP"
        description="Ask questions in plain English and get evidence-backed answers from customer feedback."
      />

      <section className="card p-5">
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4">
          <Bot className="mt-0.5 text-indigo-700" size={20} />

          <div>
            <p className="font-semibold text-indigo-950">
              Grounded answers only
            </p>

            <p className="mt-1 text-sm leading-6 text-indigo-900/80">
              Answers should be generated only from feedback retrieved from
              your current workspace and should show the source feedback used.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setQuestion(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 flex gap-2">
          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about customer feedback..."
            disabled={loading}
          />

          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={loading || !question.trim()}
          >
            <Send size={16} className="mr-2" />

            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>
      </section>

      {answer && (
        <section className="card mt-6 p-6">
          <h2 className="font-semibold">LOOP answer</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {answer.answer}
          </p>

          <div className="mt-7 border-t border-line pt-5">
            <h3 className="font-semibold">Sources</h3>

            {answer.sources.length ? (
              <div className="mt-3 space-y-3">
                {answer.sources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-lg border border-line p-4"
                  >
                    <p className="text-sm leading-6 text-slate-700">
                      {source.text}
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      {source.channel} ·{" "}
                      {formatSourceDate(source.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No source feedback returned.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}