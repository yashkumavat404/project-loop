"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Demo Workspace");
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Workspace and account settings."
      />

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-muted">Workspace-level information.</p>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium">Workspace name</label>
          <input className="input" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
        </div>

        <button
          className="btn-primary mt-4"
          onClick={() => setSaved(true)}
        >
          Save changes
        </button>

        {saved && <p className="mt-3 text-sm text-emerald-700">UI state saved. Connect this action to the workspace API during integration.</p>}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Your role</h2>
        <p className="mt-1 text-sm text-muted">Role permissions are enforced server-side.</p>
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold">ADMIN</p>
          <p className="mt-1 text-xs text-muted">Demo role shown by the frontend until the authenticated session is connected.</p>
        </div>
      </section>
    </div>
  );
}