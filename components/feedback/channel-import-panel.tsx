"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { simulatedChannels, type SimulatedChannel } from "@/lib/simulated-channels";

export function ChannelImportPanel() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { imported: number; failed: number }>>({});
  const [error, setError] = useState("");

  async function importChannel(channel: SimulatedChannel) {
    try {
      setLoadingKey(channel.key);
      setError("");
      const response = await api.importFeedbackCsv(
        channel.items.map((item) => ({
          text: item.text,
          channel: channel.key,
          customerLabel: item.customerLabel
        }))
      );
      setResults((prev) => ({ ...prev, [channel.key]: response }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold">Import demo data</h2>
      <p className="mt-1 text-sm text-muted">
        Simulate a live channel integration by importing realistic sample feedback.
      </p>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {simulatedChannels.map((channel) => {
          const result = results[channel.key];
          return (
            <div key={channel.key} className="rounded-lg border border-line p-4">
              <p className="font-semibold">{channel.label}</p>
              <p className="mt-0.5 text-xs text-muted">{channel.description}</p>
              <button
                className="btn-secondary mt-3 w-full"
                onClick={() => importChannel(channel)}
                disabled={loadingKey === channel.key}
              >
                {loadingKey === channel.key ? "Importing..." : `Import ${channel.label}`}
              </button>
              {result && (
                <p className="mt-2 text-xs text-emerald-700">
                  Imported {result.imported}
                  {result.failed > 0 ? `, ${result.failed} failed` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}