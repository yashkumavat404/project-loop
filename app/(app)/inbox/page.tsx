"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FeedbackFilters } from "@/components/feedback/feedback-filters";
import { FeedbackRow } from "@/components/feedback/feedback-row";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { api } from "@/lib/api";
import { demoFeedback } from "@/lib/demo-data";
import type { Feedback } from "@/lib/types";

export default function InboxPage() {
  const [items, setItems] = useState<Feedback[]>(demoFeedback);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [channel, setChannel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20"
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (sentiment) params.set("sentiment", sentiment);
    if (channel) params.set("channel", channel);

    api.getFeedback(params)
      .then((result) => setItems(result.items))
      .catch(() => {
        // Demo fallback.
      });
  }, [page, search, status, sentiment, channel]);

  const filteredDemo = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.text.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(search.toLowerCase());

      return (
        matchesSearch &&
        (!status || item.status === status) &&
        (!sentiment || item.sentiment === sentiment) &&
        (!channel || item.channel === channel)
      );
    });
  }, [items, search, status, sentiment, channel]);

  return (
    <div>
      <PageHeader
        title="Feedback Inbox"
        description="Search, filter and manage customer feedback."
        action={
          <div className="flex gap-2">
            <Link href="/inbox/import" className="btn-secondary">
              <Upload size={16} className="mr-2" />
              Import CSV
            </Link>
            <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
              <Plus size={16} className="mr-2" />
              Add feedback
            </button>
          </div>
        }
      />

      {showForm && (
        <section className="card mb-6 p-5">
          <h2 className="mb-4 text-lg font-semibold">Add customer feedback</h2>
          <FeedbackForm onCreated={() => setShowForm(false)} />
        </section>
      )}

      <section className="card p-4">
        <FeedbackFilters
          search={search}
          status={status}
          sentiment={sentiment}
          channel={channel}
          onSearch={(v) => { setPage(1); setSearch(v); }}
          onStatus={(v) => { setPage(1); setStatus(v); }}
          onSentiment={(v) => { setPage(1); setSentiment(v); }}
          onChannel={(v) => { setPage(1); setChannel(v); }}
        />

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          {filteredDemo.length ? (
            filteredDemo.map((feedback) => (
              <FeedbackRow key={feedback.id} feedback={feedback} />
            ))
          ) : (
            <div className="p-10 text-center">
              <p className="font-semibold">No feedback found</p>
              <p className="mt-1 text-sm text-muted">Try changing your search or filters.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">Page {page}</p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-secondary" onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}