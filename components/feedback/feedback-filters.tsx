"use client";

interface FeedbackFiltersProps {
  search: string;
  status: string;
  sentiment: string;
  channel: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onSentiment: (value: string) => void;
  onChannel: (value: string) => void;
}

export function FeedbackFilters(props: FeedbackFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <input
        className="input md:col-span-2"
        placeholder="Search feedback..."
        value={props.search}
        onChange={(e) => props.onSearch(e.target.value)}
      />
      <select className="input" value={props.status} onChange={(e) => props.onStatus(e.target.value)}>
        <option value="">All statuses</option>
        <option value="NEW">New</option>
        <option value="REVIEWED">Reviewed</option>
        <option value="ACTIONED">Actioned</option>
      </select>
      <select className="input" value={props.sentiment} onChange={(e) => props.onSentiment(e.target.value)}>
        <option value="">All sentiment</option>
        <option value="POSITIVE">Positive</option>
        <option value="NEUTRAL">Neutral</option>
        <option value="NEGATIVE">Negative</option>
      </select>
      <select className="input" value={props.channel} onChange={(e) => props.onChannel(e.target.value)}>
        <option value="">All channels</option>
        <option value="WEB">Web</option>
        <option value="CSV">CSV</option>
        <option value="EMAIL">Email</option>
        <option value="SUPPORT">Support</option>
        <option value="APP_STORE">App Store</option>
        <option value="SURVEY">Survey</option>
      </select>
    </div>
  );
}