import { Bell, Menu } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export async function Topbar() {
  const session = await getServerSession(authOptions);

  const userName = session?.user?.name ?? "User";
  const userRole = session?.user?.role ?? "VIEWER";

  const initials = userName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
      <button
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-4">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 hover:bg-slate-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {initials || "U"}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-ink">
                {userName}
              </p>

              <p className="text-xs text-muted">
                {userRole}
              </p>
            </div>
          </summary>

          <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-line bg-white p-1 shadow-lg">
            <LogoutButton />
          </div>
        </details>
      </div>
    </header>
  );
}