"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Target,
  Link2,
  RefreshCw,
  MessageSquare,
  Search,
  FlaskConical,
  Globe,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/internal-links", label: "Internal Links", icon: Link2 },
  { href: "/content-refresh", label: "Content Refresh", icon: RefreshCw },
  { href: "/coach", label: "AI Coach", icon: MessageSquare },
  { href: "/competitor", label: "Competitor Spy", icon: Search },
];

function ConnectionChip({ status }: { status: ConnectionStatus }) {
  if (status.demo) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
        <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-800">Demo mode</p>
          <p className="text-xs text-amber-600 truncate">trailgearhub.com</p>
        </div>
      </div>
    );
  }
  if (status.connected && status.property) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-800">Connected</p>
          <p className="text-xs text-emerald-600 truncate">
            {status.property.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>
    );
  }
  if (status.connected) {
    return (
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 hover:border-indigo-300 transition-colors"
      >
        <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-indigo-800">Google connected</p>
          <p className="text-xs text-indigo-500 truncate">Choose a property</p>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 hover:border-indigo-300 transition-colors"
    >
      <CircleDot className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600">Not connected</p>
        <p className="text-xs text-slate-400 truncate">Connect Search Console</p>
      </div>
    </Link>
  );
}

export function AppShell({
  status,
  children,
}: {
  status: ConnectionStatus;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const nav = (orientation: "vertical" | "horizontal") => (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto px-4 pb-2"
      )}
    >
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-200 z-20">
        <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
          <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-indigo-600">
            <Bot className="w-5 h-5 text-white" />
          </span>
          <span className="font-bold tracking-tight">AI SEO Employee</span>
        </Link>
        <div className="flex-1 overflow-y-auto p-3">{nav("vertical")}</div>
        <div className="p-3 border-t border-slate-100">
          <ConnectionChip status={status} />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex w-7 h-7 items-center justify-center rounded-lg bg-indigo-600">
              <Bot className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold tracking-tight text-sm">AI SEO Employee</span>
          </Link>
        </div>
        {nav("horizontal")}
      </header>

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
