"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { ArrowLeft, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type ParsedRow = {
  rowNumber: number;
  content: string;
  channel: string;
  customerLabel?: string;
  createdAt?: string;
  valid: boolean;
  error?: string;
};

const ALLOWED_CHANNELS = ["WEB", "EMAIL", "SUPPORT", "SURVEY", "APP_STORE", "CSV"];

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setRows([]);
    setResult(null);
    setMessage("");
    if (selected) {
      parseFile(selected);
    }
  }

  function parseFile(selected: File) {
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedRow[] = (results.data as Record<string, string>[]).map((raw, index) => {
          const content = (raw.content || raw.text || "").trim();
          const channelRaw = (raw.channel || "").trim().toUpperCase();
          const customerLabel = (raw.customer_label || raw.customerLabel || "").trim();
          const createdAt = (raw.created_at || raw.createdAt || "").trim();

          let error: string | undefined;
          if (!content) {
            error = "Missing content";
          } else if (!channelRaw) {
            error = "Missing channel";
          } else if (!ALLOWED_CHANNELS.includes(channelRaw)) {
            error = `Unknown channel "${channelRaw}"`;
          }

          return {
            rowNumber: index + 2, // +2 accounts for header row + 1-indexing
            content,
            channel: channelRaw,
            customerLabel: customerLabel || undefined,
            createdAt: createdAt || undefined,
            valid: !error,
            error
          };
        });

        if (parsed.length === 0) {
          setMessage("The CSV file appears to be empty.");
        }
        setRows(parsed);
      },
      error: (err) => {
        setMessage(`Could not read the file: ${err.message}`);
      }
    });
  }

  async function runImport() {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setMessage("No valid rows to import. Fix the errors below and re-upload.");
      return;
    }

    try {
      setImporting(true);
      setMessage("");
      const response = await api.importFeedbackCsv(
        validRows.map((r) => ({
          text: r.content,
          channel: r.channel,
          customerLabel: r.customerLabel,
          createdAt: r.createdAt
        }))
      );
      setResult({
        imported: response.imported,
        failed: response.failed + (rows.length - validRows.length)
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/inbox" className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Back to inbox
      </Link>

      <section className="card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-700">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Import feedback CSV</h1>
            <p className="text-sm text-muted">
              Columns: <code>content</code>, <code>channel</code>, <code>customer_label</code>,{" "}
              <code>created_at</code>
            </p>
          </div>
        </div>

        <label className="mt-6 block cursor-pointer rounded-xl border-2 border-dashed border-line p-10 text-center hover:bg-slate-50">
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          <p className="font-semibold">{file ? file.name : "Choose CSV file"}</p>
          <p className="mt-1 text-xs text-muted">CSV only</p>
        </label>

        {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}

        {rows.length > 0 && !result && (
          <>
            <div className="mt-6 flex gap-4 text-sm">
              <Badge tone="positive">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge tone="negative">{invalidCount} with errors</Badge>}
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Content</th>
                    <th className="px-3 py-2">Channel</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-line">
                      <td className="px-3 py-2 text-muted">{row.rowNumber}</td>
                      <td className="max-w-xs truncate px-3 py-2">{row.content || "—"}</td>
                      <td className="px-3 py-2">{row.channel || "—"}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <Badge tone="positive">OK</Badge>
                        ) : (
                          <Badge tone="negative">{row.error}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn-primary mt-5" onClick={runImport} disabled={importing || validCount === 0}>
              {importing ? "Importing..." : `Import ${validCount} valid row${validCount === 1 ? "" : "s"}`}
            </button>
          </>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-line bg-slate-50 p-4">
            <p className="text-sm font-semibold">Import complete</p>
            <p className="mt-1 text-sm">
              Imported: <span className="font-semibold text-emerald-700">{result.imported}</span>
              {"  ·  "}
              Failed: <span className="font-semibold text-rose-700">{result.failed}</span>
            </p>
            <Link href="/inbox" className="mt-3 inline-block text-sm font-medium text-indigo-700 hover:underline">
              Back to inbox
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}