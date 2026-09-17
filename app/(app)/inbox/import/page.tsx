"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

type ImportResponse = {
  message: string;
  imported?: number;
  failed?: number;
  totalRows?: number;
  errors?: Array<{
    row: number;
    message: string;
  }>;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;

    setFile(selectedFile);
    setMessage("");
    setResult(null);
  }

  async function upload() {
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Only CSV files are supported.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ingestion", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = (await response.json()) as ImportResponse;

      if (!response.ok) {
        setMessage(data.message || `Import failed (${response.status}).`);
        setResult(data);
        return;
      }

      setResult(data);

      setMessage(
        `Import completed: ${data.imported ?? 0} feedback records imported.`
      );
    } catch (error) {
      console.error("CSV upload error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the CSV file."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/inbox"
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
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
              Upload a CSV containing customer feedback.
            </p>
          </div>
        </div>

        <label className="mt-6 block cursor-pointer rounded-xl border-2 border-dashed border-line p-10 text-center hover:bg-slate-50">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />

          <p className="font-semibold">
            {file ? file.name : "Choose CSV file"}
          </p>

          <p className="mt-1 text-xs text-muted">CSV only</p>
        </label>

        {message && (
          <p className="mt-4 text-sm text-slate-600">{message}</p>
        )}

        {result && (
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4 text-sm">
            <p>
              <strong>Imported:</strong> {result.imported ?? 0}
            </p>

            <p>
              <strong>Failed:</strong> {result.failed ?? 0}
            </p>

            <p>
              <strong>Total rows:</strong> {result.totalRows ?? 0}
            </p>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold">Errors:</p>

                <ul className="mt-1 list-disc pl-5">
                  {result.errors.map((error) => (
                    <li key={`${error.row}-${error.message}`}>
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={upload}
          disabled={isUploading}
        >
          {isUploading ? "Importing..." : "Import CSV"}
        </button>
      </section>
    </div>
  );
}