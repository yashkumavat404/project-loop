"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { SentimentPoint } from "@/lib/types";

export function SentimentChart({ data }: { data: SentimentPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="positive" stackId="1" fill="#86efac" stroke="#16a34a" />
          <Area type="monotone" dataKey="neutral" stackId="1" fill="#cbd5e1" stroke="#64748b" />
          <Area type="monotone" dataKey="negative" stackId="1" fill="#fda4af" stroke="#e11d48" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}