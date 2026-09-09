"use client";

import { Bell, Menu } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
      <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-4">
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            Y
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-ink">Demo User</p>
            <p className="text-xs text-muted">ADMIN</p>
          </div>
        </div>
      </div>
    </header>
  );
}