"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Sparkles
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Feedback Inbox", icon: Inbox },
  { href: "/trends", label: "Trends & Themes", icon: BarChart3 },
  { href: "/ask", label: "Ask LOOP", icon: MessageSquareText },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-white lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-line px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          L
        </div>
        <div>
          <p className="font-bold text-ink">LOOP</p>
          <p className="text-[10px] text-muted">Customer intelligence</p>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mt-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} />
          AI insights
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          Ask questions about real customer feedback and trace answers back to sources.
        </p>
      </div>
    </aside>
  );
}