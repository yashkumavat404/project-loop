"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import { demoReports } from "@/lib/demo-data";
import type { Report } from "@/lib/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(demoReports);
  const [start, setStart] = useState("2026-08-31");
  const [end, setEnd] = useState("2026-09-06");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getReports().then(setReports).catch(() => {});
  }, []);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const report = await api.createReport(start, end);
      setReports((current) => [report, ...current]);
      setMessage("Report generated.");
    } catch {
      setMessage("Report API is not connected yet. The backend will generate the real report from the selected period.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Voice of Customer Reports"
        description="Generate leadership-ready summaries from actual feedback data."
      />

      <section className="card p-5">
        <h2 className="font-semibold">Generate a report</h2>
        <form onSubmit={generate} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">From</label>
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">To</label>
            <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button className="btn-primary self-end" disabled={loading}>
            {loading ? "Generating..." : "Generate report"}
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </section>

      <section className="mt-6 space-y-4">
        {reports.map((report) => (
          <article key={report.id} className="card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="rounded-lg bg-indigo-50 p-3 text-indigo-700">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-semibold">{report.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {report.periodStart} → {report.periodEnd}
                  </p>
                </div>
              </div>
              <button className="btn-secondary">
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-700">{report.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {report.topThemes.map((theme) => (
                <span key={theme.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {theme.name} · {theme.count}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}