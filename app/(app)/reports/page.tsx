"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [start, setStart] = useState("2026-08-31");
  const [end, setEnd] = useState("2026-09-06");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        const data = await api.getReports();

        if (mounted) {
          setReports(data);
        }
      } catch {
        if (mounted) {
          setReports([]);
        }
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      mounted = false;
    };
  }, []);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const report = await api.createReport(start, end);

      setReports((current) => [report, ...current]);
      setMessage("Report generated successfully.");
    } catch (error) {
      const apiError = error as {
        status?: number;
        message?: string;
      };

      const errorMessage = apiError?.message?.toLowerCase() ?? "";

      if (
        apiError?.status === 403 ||
        errorMessage.includes("403") ||
        errorMessage.includes("forbidden")
      ) {
        setMessage(
          "You don't have permission to generate reports. Viewers can only view existing reports."
        );
      } else {
        setMessage(
          "Failed to generate the report. Please check the selected dates and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function exportReport(report: Report) {
    const reportText = [
      "LOOP — VOICE OF CUSTOMER REPORT",
      "",
      `Title: ${report.title}`,
      `Period: ${report.periodStart} → ${report.periodEnd}`,
      `Created: ${report.createdAt}`,
      "",
      "SUMMARY",
      report.summary,
      "",
      "TOP THEMES",
      ...report.topThemes.map(
        (theme) => `- ${theme.name}: ${theme.count}`
      ),
      "",
      "INSIGHTS",
      ...report.insights.map((insight) => `- ${insight}`),
      "",
      "RECOMMENDATIONS",
      ...report.recommendations.map(
        (recommendation) => `- ${recommendation}`
      ),
      ""
    ].join("\n");

    const blob = new Blob([reportText], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${report.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Voice of Customer Reports"
        description="Generate leadership-ready summaries from actual feedback data."
      />

      <section className="card p-5">
        <h2 className="font-semibold">Generate a report</h2>

        <form
          onSubmit={generate}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              From
            </label>

            <input
              className="input"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              To
            </label>

            <input
              className="input"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary self-end"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate report"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-sm text-muted">
            {message}
          </p>
        )}
      </section>

      <section className="mt-6 space-y-4">
        {initialLoading ? (
          <div className="card p-8 text-center">
            <FileText
              size={32}
              className="mx-auto mb-3 animate-pulse text-muted"
            />

            <h2 className="font-semibold">
              Loading reports...
            </h2>

            <p className="mt-1 text-sm text-muted">
              Checking reports for your workspace.
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText
              size={32}
              className="mx-auto mb-3 text-muted"
            />

            <h2 className="font-semibold">
              No reports available
            </h2>

            <p className="mt-1 text-sm text-muted">
              Generate a Voice of Customer report using the form above.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="rounded-lg bg-indigo-50 p-3 text-indigo-700">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {report.title}
                    </h2>

                    <p className="mt-1 text-xs text-muted">
                      {report.periodStart} → {report.periodEnd}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => exportReport(report)}
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold">
                  Summary
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {report.summary}
                </p>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold">
                  Top Themes
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {report.topThemes.length > 0 ? (
                    report.topThemes.map((theme) => (
                      <span
                        key={theme.name}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium"
                      >
                        {theme.name} · {theme.count}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted">
                      No themes available for this report.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold">
                  Insights
                </h3>

                {report.insights.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {report.insights.map((insight, index) => (
                      <li key={`${report.id}-insight-${index}`}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    No insights available for this report.
                  </p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold">
                  Recommendations
                </h3>

                {report.recommendations.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {report.recommendations.map(
                      (recommendation, index) => (
                        <li
                          key={`${report.id}-recommendation-${index}`}
                        >
                          {recommendation}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    No recommendations available for this report.
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}