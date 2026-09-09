"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Feedback } from "@/lib/types";

function sentimentTone(value?: Feedback["sentiment"]) {
  if (value === "POSITIVE") return "positive" as const;
  if (value === "NEGATIVE") return "negative" as const;
  return "neutral" as const;
}

export function FeedbackRow({ feedback }: { feedback: Feedback }) {
  const router = useRouter();
  const themeText = (feedback.themes || [])
    .map((theme) => typeof theme === "string" ? theme : theme.name)
    .slice(0, 2)
    .join(", ");

  return (
    <button
      onClick={() => router.push(`/inbox/${feedback.id}`)}
      className="w-full border-b border-line px-4 py-4 text-left transition hover:bg-slate-50"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {feedback.customerName || "Anonymous customer"}
            </span>
            <Badge tone={sentimentTone(feedback.sentiment)}>
              {feedback.sentiment || "UNCLASSIFIED"}
            </Badge>
            <Badge>{feedback.status}</Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{feedback.text}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span>{feedback.channel}</span>
            {feedback.featureArea && <span>{feedback.featureArea}</span>}
            {themeText && <span>{themeText}</span>}
          </div>
        </div>
        <time className="shrink-0 text-xs text-muted">
          {new Date(feedback.createdAt).toLocaleDateString()}
        </time>
      </div>
    </button>
  );
}