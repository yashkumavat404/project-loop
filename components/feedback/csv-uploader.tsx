"use client";

import { ChangeEvent } from "react";

export function CSVUploader({
  fileName,
  onFileSelected
}: {
  fileName: string | null;
  onFileSelected: (file: File) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) onFileSelected(selected);
  }

  return (
    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-line p-10 text-center hover:bg-slate-50">
      <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleChange} />
      <p className="font-semibold">{fileName || "Choose CSV file"}</p>
      <p className="mt-1 text-xs text-muted">CSV only</p>
    </label>
  );
}