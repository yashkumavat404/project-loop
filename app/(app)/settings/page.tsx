"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

interface SessionUser {
  name?: string | null;
  role?: UserRole;
}

interface SessionResponse {
  user?: SessionUser;
}

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Demo Workspace");
  const [saved, setSaved] = useState(false);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load authenticated session.");
        }

        const session: SessionResponse = await response.json();

        setUserRole(session.user?.role ?? null);
        setUserName(session.user?.name ?? null);
      } catch (error) {
        console.error("Failed to load session:", error);
        setUserRole(null);
        setUserName(null);
      } finally {
        setLoadingRole(false);
      }
    }

    loadSession();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Workspace and account settings."
      />

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Workspace</h2>

        <p className="mt-1 text-sm text-muted">
          Workspace-level information.
        </p>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium">
            Workspace name
          </label>

          <input
            className="input"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
        </div>

        <button
          className="btn-primary mt-4"
          onClick={() => setSaved(true)}
        >
          Save changes
        </button>

        {saved && (
          <p className="mt-3 text-sm text-emerald-700">
            UI state saved. Connect this action to the workspace API during
            integration.
          </p>
        )}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Your role</h2>

        <p className="mt-1 text-sm text-muted">
          Role permissions are enforced server-side.
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          {loadingRole ? (
            <p className="text-sm font-semibold">Loading role...</p>
          ) : userRole ? (
            <>
              <p className="text-sm font-semibold">{userRole}</p>

              <p className="mt-1 text-xs text-muted">
                {userName
                  ? `${userName} is signed in with the ${userRole} role.`
                  : `Authenticated as ${userRole}.`}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Not available</p>

              <p className="mt-1 text-xs text-muted">
                The authenticated session could not be loaded.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}