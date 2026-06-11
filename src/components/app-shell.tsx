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
  LogOut,
  Crown,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/types";
import type { DbUser } from "@/lib/db";
import { UsageMeter } from "@/components/usage-meter";
import { PropertySelector } from "@/components/property-selector";

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
  user,
  isSignedIn,
  spentUsd,
  capUsd,
  isPro,
  children,
}: {
  status: ConnectionStatus;
  user: DbUser | null;
  isSignedIn: boolean;
  spentUsd: number;
  capUsd: number;
  isPro: boolean;
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
            <Icon
              className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")}
            />
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
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100"
        >
          <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-indigo-600">
            <Bot className="w-5 h-5 text-white" />
          </span>
          <span className="font-bold tracking-tight">AI SEO</span>
        </Link>

        <div className="flex-1 overflow-y-auto p-3">
          <PropertySelector status={status} />
          {nav("vertical")}
        </div>

        <div className="p-3 border-t border-slate-100 space-y-3">
          {/* Usage meter */}
          {user && (
            <div className="flex items-center justify-between px-1">
              <UsageMeter spentUsd={spentUsd} capUsd={capUsd} isPro={isPro} />
              {!isPro && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </Link>
              )}
            </div>
          )}

          <ConnectionChip status={status} />

          {/* User section */}
          {isSignedIn ? (
            <div className="flex items-center gap-2 px-1">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? user.email}
                  className="w-7 h-7 rounded-full shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-indigo-600">
                    {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {user?.name ?? user?.email ?? "Signed in"}
                </p>
                {isPro && (
                  <p className="text-xs text-indigo-500 font-medium">Pro plan</p>
                )}
              </div>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign out"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Link>
          )}

          {/* Usage page link */}
          {user && (
            <Link
              href="/usage"
              className="flex items-center gap-2 px-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <BarChart3 className="w-3 h-3" />
              View usage details
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex w-7 h-7 items-center justify-center rounded-lg bg-indigo-600">
              <Bot className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold tracking-tight text-sm">AI SEO</span>
          </Link>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name ?? user.email}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-600">
                      {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/api/auth/google"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
        {nav("horizontal")}
      </header>

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
