"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}