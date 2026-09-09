"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeBarChart } from "@/components/charts/theme-bar-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { demoThemes, demoVolume } from "@/lib/demo-data";

export default function TrendsPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div>
      <PageHeader
        title="Trends & Themes"
        description="Understand which customer topics are growing and where sentiment is changing."
        action={
          <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Feedback volume</h2>
          <p className="mt-1 text-xs text-muted">Volume trend for the selected period.</p>
          <div className="mt-4"><VolumeChart data={demoVolume} /></div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Theme frequency</h2>
          <p className="mt-1 text-xs text-muted">Themes ranked by feedback count.</p>
          <div className="mt-4"><ThemeBarChart data={demoThemes} /></div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="font-semibold">Theme changes</h2>
          <p className="mt-1 text-xs text-muted">Potential spikes and drops that deserve attention.</p>
        </div>
        <div className="divide-y divide-line">
          {demoThemes.map((theme) => (
            <div key={theme.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{theme.name}</p>
                <p className="text-xs text-muted">{theme.count} feedback items</p>
              </div>
              <span className={`text-sm font-semibold ${theme.changePercent && theme.changePercent > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {theme.changePercent && theme.changePercent > 0 ? "+" : ""}{theme.changePercent}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}