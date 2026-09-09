"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] || null);
    setMessage("");
  }

  async function upload() {
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }

    // Backend contract will be connected here after Mani's import endpoint is available.
    setMessage(`Selected ${file.name}. Import API will be connected during integration.`);
  }

  return (
    <div className="mx-auto max-w-2xl">
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
            <p className="text-sm text-muted">Upload a CSV containing customer feedback.</p>
          </div>
        </div>

        <label className="mt-6 block cursor-pointer rounded-xl border-2 border-dashed border-line p-10 text-center hover:bg-slate-50">
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          <p className="font-semibold">{file ? file.name : "Choose CSV file"}</p>
          <p className="mt-1 text-xs text-muted">CSV only</p>
        </label>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}

        <button className="btn-primary mt-5" onClick={upload}>
          Import CSV
        </button>
      </section>
    </div>
  );
}