"use client";

import { useEffect, useState } from "react";
import { BarChart3, MessageCircle, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { VolumeChart } from "@/components/charts/volume-chart";
import { SentimentChart } from "@/components/charts/sentiment-chart";
import { ThemeBarChart } from "@/components/charts/theme-bar-chart";
import { api } from "@/lib/api";
import { demoSentiment, demoStats, demoThemes, demoVolume } from "@/lib/demo-data";
import type { DashboardStats, SentimentPoint, Theme, TrendPoint } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(demoStats);
  const [volume, setVolume] = useState<TrendPoint[]>(demoVolume);
  const [sentiment, setSentiment] = useState<SentimentPoint[]>(demoSentiment);
  const [themes, setThemes] = useState<Theme[]>(demoThemes);

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getVolumeTrend(),
      api.getSentimentTrend()
    ]).then(([s, v, se]) => {
      setStats(s);
      setVolume(v);
      setSentiment(se as unknown as SentimentPoint[]);
    }).catch(() => {
      // Demo fallback keeps the UI usable before backend integration.
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A quick view of what customers are saying across your workspace."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total feedback" value={stats.totalFeedback} helper="All channels" />
        <StatCard label="Negative feedback" value={`${stats.negativePercent}%`} helper="Current period" />
        <StatCard label="New this week" value={stats.newThisWeek} helper="Needs review" />
        <StatCard label="Resolved" value={`${stats.resolvedPercent}%`} helper="Of tracked feedback" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle size={18} />
            <div>
              <h2 className="font-semibold">Feedback volume</h2>
              <p className="text-xs text-muted">Incoming feedback over time</p>
            </div>
          </div>
          <VolumeChart data={volume} />
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            <div>
              <h2 className="font-semibold">Sentiment</h2>
              <p className="text-xs text-muted">Positive, neutral and negative feedback</p>
            </div>
          </div>
          <SentimentChart data={sentiment} />
        </section>

        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            <div>
              <h2 className="font-semibold">Top themes</h2>
              <p className="text-xs text-muted">Most frequently mentioned customer themes</p>
            </div>
          </div>
          <ThemeBarChart data={themes} />
        </section>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} />
            <h3 className="font-semibold">Watch closely</h3>
          </div>
          <p className="mt-2 text-sm text-muted">
            Performance and onboarding are currently the strongest negative themes.
          </p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Data scope</h3>
          <p className="mt-2 text-sm text-muted">
            All metrics shown here should be scoped to the authenticated workspace by the API.
          </p>
        </div>
      </div>
    </div>
  );
}