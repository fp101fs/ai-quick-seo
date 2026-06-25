"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
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
  Lightbulb,
  Sun,
  Moon,
  Hash,
  Activity,
  Gauge,
  ListChecks,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/types";
import type { DbUser } from "@/lib/db";
import { UsageMeter } from "@/components/usage-meter";
import { PropertySelector } from "@/components/property-selector";
import { getNavCounts } from "@/app/actions/seo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, iconColor: "text-indigo-500", tooltip: "Daily SEO briefing: traffic overview, quick wins, and your AI-prioritized task list." },
  { href: "/opportunities", label: "Opportunities", icon: Target, iconColor: "text-rose-500", tooltip: "Pages losing clicks, queries near page 1, low CTR issues — ranked by impact." },
  { href: "/action-plan", label: "Action Plan", icon: ListChecks, iconColor: "text-emerald-500", tooltip: "Top 10 ranked SEO tasks with copy-ready Claude prompts. One click to copy them all." },
  { href: "/article-ideas", label: "Article Ideas", icon: Lightbulb, iconColor: "text-amber-500", tooltip: "AI-generated article titles for keyword gaps your site isn't covering yet." },
  { href: "/content-refresh", label: "Content Refresh", icon: RefreshCw, iconColor: "text-cyan-500", tooltip: "AI-drafted title, meta description, new H2 sections, and FAQs for any existing page." },
  { href: "/page-grader", label: "Page Grader", icon: Gauge, iconColor: "text-violet-500", tooltip: "Grade any page out of 100 for SEO and AI search readiness. Get a step-by-step plan to reach 100." },
  { href: "/internal-links", label: "Internal Links", icon: Link2, iconColor: "text-blue-500", tooltip: "Crawls your sitemap to find orphan pages and suggest where to add internal links." },
  { href: "/coach", label: "AI Coach", icon: MessageSquare, iconColor: "text-purple-500", tooltip: "Chat with an AI that knows your site's data — ask why traffic dropped, what to fix, etc." },
  { href: "/keywords", label: "Keywords", icon: Hash, iconColor: "text-teal-500", tooltip: "Top queries from Google Search Console with clicks, impressions, CTR, and average position." },
  { href: "/rank-tracking", label: "Rank Tracking", icon: Activity, iconColor: "text-orange-500", tooltip: "Track keyword positions over time using your GSC data. Click any keyword to see its trend." },
  { href: "/sitemap-explorer", label: "Sitemap Explorer", icon: Layers, iconColor: "text-sky-500", tooltip: "Browse all your pages in a tree view. Click Grade or Improve to take action on any page." },
  { href: "/competitor", label: "Competitor Spy", icon: Search, iconColor: "text-slate-400", tooltip: "Enter a competitor URL to extract their target keywords, content gaps, and blog ideas.", dim: true },
] as const;

function ConnectionChip({ status }: { status: ConnectionStatus }) {
  if (status.demo) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
        <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Demo mode</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 truncate">trailgearhub.com</p>
        </div>
      </div>
    );
  }
  if (status.connected && status.property) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
        <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Connected</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
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
        className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
      >
        <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Google connected</p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">Choose a property</p>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
    >
      <CircleDot className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Not connected</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Connect Search Console</p>
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
  const { resolvedTheme, setTheme } = useTheme();
  // ponytail: mounted guard prevents hydration mismatch — resolvedTheme is
  // undefined on server/first render, causing different icon than client
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState<{ text: string; y: number } | null>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { getNavCounts().then(setCounts).catch(() => {}); }, []);

  const nav = (orientation: "vertical" | "horizontal") => (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-0.5"
          : "flex gap-1 overflow-x-auto px-4 pb-2"
      )}
    >
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        const dim = "dim" in item && item.dim;
        return (
          <div key={item.href} className={cn("flex items-center", dim && "opacity-50")}>
            <Link
              href={item.href}
              className={cn(
                "flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
              )}
              onMouseEnter={orientation === "vertical" && item.tooltip ? (e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTooltip({ text: item.tooltip, y: rect.top + rect.height / 2 });
              } : undefined}
              onMouseLeave={orientation === "vertical" ? () => setTooltip(null) : undefined}
            >
              <Icon
                className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600" : item.iconColor)}
              />
              {item.label}
              {orientation === "vertical" && counts[item.href] ? (
                <span className="ml-auto text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  {counts[item.href]}
                </span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Fixed tooltip — rendered outside sidebar to escape overflow:auto */}
      {tooltip && (
        <div
          className="fixed left-[264px] z-50 ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg max-w-xs pointer-events-none"
          style={{ top: tooltip.y, transform: "translateY(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 dark:border-slate-700"
        >
          <img src="/icon-512.png" className="w-8 h-8 rounded-lg" alt="SerpDo" />
          <div className="flex-1 flex flex-col leading-none">
            <span className="font-bold tracking-tight">SerpDo</span>
            <span className="text-[11px] text-slate-400 tracking-wide mt-1.5 text-right" style={{ fontFamily: "var(--font-michroma)" }}>by BravioLabs</span>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto p-3">
          <PropertySelector status={status} />
          {nav("vertical")}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
          {/* Usage meter */}
          {user && (
            <div className="flex items-center justify-between px-1">
              <UsageMeter spentUsd={spentUsd} capUsd={capUsd} isPro={isPro} />
              {!isPro && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
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
              {isPro && (
                <p className="text-xs text-indigo-500 font-medium">Pro</p>
              )}
              <form action="/api/auth/logout" method="POST" className="ml-auto">
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
            <a
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
            </a>
          )}

          {/* Usage page link + dark mode toggle */}
          <div className="flex items-center justify-between px-1">
            {user ? (
              <Link
                href="/usage"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <BarChart3 className="w-3 h-3" />
                View usage details
              </Link>
            ) : <span />}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle dark mode"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" className="w-7 h-7 rounded-lg" alt="SerpDo" />
            <div className="flex flex-col leading-none">
              <span className="font-bold tracking-tight text-sm">SerpDo</span>
              <span className="text-[10px] text-slate-400 tracking-wide mt-1.5" style={{ fontFamily: "var(--font-michroma)" }}>by BravioLabs</span>
            </div>
          </Link>
          <div className="relative flex items-center">
            {isSignedIn ? (
              <>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="focus:outline-none"
                  aria-label="Account menu"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name ?? user.email} className="w-8 h-8 rounded-full ring-2 ring-transparent hover:ring-indigo-400 transition-all" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-transparent hover:ring-indigo-400 transition-all">
                      <span className="text-xs font-semibold text-indigo-600">
                        {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-40 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 py-1 text-sm">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name ?? user?.email ?? "Account"}</p>
                        {isPro ? (
                          <p className="text-xs text-indigo-500 font-medium">Pro plan</p>
                        ) : (
                          <p className="text-xs text-slate-400">Free plan</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setMenuOpen(false); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        {mounted && resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                      </button>
                      <Link
                        href="/usage"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View usage
                      </Link>
                      {!isPro && (
                        <Link
                          href="/pricing"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro
                        </Link>
                      )}
                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <form action="/api/auth/logout" method="POST">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <a
                href="/api/auth/google"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                Sign in
              </a>
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
