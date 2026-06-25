"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Crown,
  Link2,
  MousePointerClick,
  Eye,
  Zap,
  TrendingDown,
  RefreshCw,
  ListChecks,
  Gauge,
  MessageSquare,
  AlertTriangle,
  X,
  History,
  DatabaseZap,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConnectGate } from "@/components/connect-gate";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import { TaskCard } from "@/components/task-card";
import { getDashboardData, getAnalysisHistory, type DashboardData } from "@/app/actions/seo";
import type { AnalysisSummary } from "@/lib/db";
import { DashboardUserChip } from "@/components/dashboard-user-chip";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActionPlan } from "@/components/action-plan";

function DeltaBadge({ delta, suffix = "" }: { delta: number; suffix?: string }) {
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        positive ? "text-emerald-600" : "text-rose-600"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {positive ? "+" : ""}
      {delta.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  icon: typeof Eye;
}) {
  return (
    <Card size="sm" className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          {delta && <div className="mt-1">{delta}</div>}
        </div>
        <span className="flex w-9 h-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
        </span>
      </CardContent>
    </Card>
  );
}

function MiniOpportunity({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span
        className={cn(
          "mt-1.5 w-2 h-2 rounded-full shrink-0",
          opportunity.impact === "high" ? "bg-indigo-600" : "bg-indigo-300"
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{opportunity.issue}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          {opportunity.recommendedAction}
        </p>
      </div>
    </div>
  );
}

function formatAnalysisDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffHours = (Date.now() - date.getTime()) / 3_600_000;
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function cleanProperty(property: string): string {
  return property.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function HistoryPanel({
  open,
  onClose,
  history,
  currentProperty,
}: {
  open: boolean;
  onClose: () => void;
  history: AnalysisSummary[] | null;
  currentProperty: string | null | undefined;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={onClose}
        />
      )}
      {/* Drawer — anchored at left-0; on desktop open state shifts right past sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0 lg:translate-x-64" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Analysis History
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {history === null ? (
            <p className="text-xs text-slate-400 text-center py-8">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No analyses yet.</p>
          ) : (
            history.map((item) => {
              const isCurrent = currentProperty && cleanProperty(item.property) === cleanProperty(currentProperty);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg px-3 py-2.5 mb-1",
                    isCurrent ? "bg-indigo-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {cleanProperty(item.property)}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-slate-300 shrink-0">current</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    {formatAnalysisDate(item.created_at)}
                  </p>
                  {item.top_task_title && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.top_task_title}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

const oauthErrorMessages: Record<string, string> = {
  state_mismatch:
    "The sign-in session expired or cookies were blocked before Google redirected back. Please try connecting again.",
  missing_code: "Google didn't return an authorization code. Please try connecting again.",
  token_exchange:
    "Google sign-in succeeded but the token exchange failed — this usually means the GOOGLE_CLIENT_SECRET is wrong or the redirect URI doesn't exactly match the one registered in Google Cloud. Check the server logs for the exact Google error, then try again.",
  access_denied: "You declined the Google permission request, so Search Console wasn't connected.",
};

function oauthErrorFromParams(params: { get(name: string): string | null }): string | null {
  if (params.get("error") === "oauth_failed") {
    const reason = params.get("reason") ?? "";
    return (
      oauthErrorMessages[reason] ??
      `Google connection failed${reason ? ` (${reason})` : ""}. Please try again.`
    );
  }
  if (params.get("error") === "google_not_configured") {
    return "Google OAuth is not configured on this deployment (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing). You can explore with demo data instead.";
  }
  return null;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(() =>
    oauthErrorFromParams(searchParams)
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<AnalysisSummary[] | null>(null);

  const fetchData = useCallback(
    (opts?: { forceRefresh?: boolean }) =>
      getDashboardData(opts)
        .then(setData)
        .catch((error: Error) => toast.error(error.message))
        .finally(() => setLoading(false)),
    []
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const hardRefresh = useCallback(() => {
    setLoading(true);
    setHistory(null);
    getDashboardData({ forceRefresh: true })
      .then((data) => { setData(data); toast.success("Refreshed from Search Console"); })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) toast.success("Google Search Console connected!");
    if (params.size > 0) window.history.replaceState(null, "", "/dashboard");
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (historyOpen && history === null) {
      getAnalysisHistory().then(setHistory);
    }
  }, [historyOpen, history]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <DashboardUserChip />
        </div>
        {/* Big, visible AI loading animation in the main area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <AiLoading
            message="Analyzing your SEO data…"
            size="lg"
            className="py-20"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const historyPanel = (
    <HistoryPanel
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
      history={history}
      currentProperty={data.status.property}
    />
  );

  const errorBanner = connectError ? (
    <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 mb-6">
      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{connectError}</p>
      <button
        onClick={() => setConnectError(null)}
        className="text-rose-400 hover:text-rose-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  // Gate until fully set up: needs a connection AND a selected property
  // (demo mode counts as both).
  if (!data.status.demo && (!data.status.connected || !data.status.property)) {
    return (
      <>
        {historyPanel}
        <PageHeader
          title="Dashboard"
          description="Your AI employee's daily SEO briefing."
          action={<DashboardUserChip />}
        />
        {errorBanner}
        <ConnectGate status={data.status} onReady={load} />
      </>
    );
  }

  const { snapshot, opportunities, tasks, crawl } = data;
  const topTask = tasks[0];
  const declines = opportunities.filter(
    (o) => o.type === "declining-clicks" || o.type === "declining-impressions"
  );
  const quickWins = opportunities.filter(
    (o) => o.type === "quick-win" || o.type === "low-ctr"
  );

  return (
    <div className="space-y-8">
      {historyPanel}
      <PageHeader
        title="Dashboard"
        description={`Daily briefing for ${data.status.property?.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "your site"}`}
        action={
          <div className="flex items-center gap-2">
            {data.fromCache && (
              <span
                title="Loaded from saved analysis. Click Refresh to re-run."
                className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-full px-2.5 py-1"
              >
                <DatabaseZap className="w-3 h-3" />
                Cached
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              className="border-slate-200"
              title="View analysis history"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button variant="outline" onClick={hardRefresh} className="border-slate-200">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <DashboardUserChip />
          </div>
        }
      />

      {errorBanner}

      {/* Pro upgrade success banner */}
      {searchParams.get("upgraded") === "1" && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl px-6 py-5 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <Crown className="w-8 h-8 text-amber-300 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg leading-tight">You&apos;re now Pro!</p>
            <p className="text-indigo-100 text-sm mt-0.5">Unlimited AI usage is active. Enjoy every feature with no caps.</p>
          </div>
          <a href="/dashboard" className="shrink-0 text-indigo-200 hover:text-white text-sm underline transition-colors">
            Dismiss
          </a>
        </div>
      )}

      {/* Action plan: compact ranked list with copy buttons */}
      {tasks.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="w-4 h-4 text-orange-500" />
              Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ActionPlan
              tasks={tasks}
              site={data.status.property?.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "")}
            />
          </CardContent>
        </Card>
      ) : data.status.connected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="w-4 h-4 text-indigo-500" />
              Getting started
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search Console doesn&apos;t have enough data yet. It needs a few days to start reporting.
              Here&apos;s what to do right now:
            </p>

            <ul className="space-y-2.5">
              {[
                { label: "Write your first 5 articles", href: "/article-ideas", note: "no GSC data needed" },
                { label: "Grade your homepage for SEO issues", href: "/page-grader", note: null },
                { label: "Confirm your sitemap is submitted in Search Console", href: "https://search.google.com/search-console/sitemaps", note: "external", external: true },
                { label: "Set up Google Analytics 4", href: "https://analytics.google.com/", note: "external", external: true },
              ].map(({ label, href, note, external }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 w-4 h-4 rounded border-2 border-slate-200 dark:border-slate-600 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {external ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 decoration-slate-300">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 decoration-slate-300">
                        {label}
                      </Link>
                    )}
                    {note && note !== "external" && (
                      <span className="ml-1.5 text-xs text-slate-400">({note})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/article-ideas"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Start with article ideas — no GSC data needed
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Today's highest impact task */}
      {topTask ? (
        <Card className="border-none shadow-lg shadow-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-0 overflow-hidden">
          <CardContent className="py-2">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                Today&apos;s highest impact task
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-snug mb-2">{topTask.title}</h2>
            {topTask.page && (
              <p className="text-indigo-200 text-xs font-mono truncate mb-3">{topTask.page}</p>
            )}
            <p className="text-indigo-100 text-sm leading-relaxed max-w-3xl mb-5">
              {topTask.explanation}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/15 text-white border-none backdrop-blur">
                <Gauge className="w-3 h-3" /> Impact {topTask.impact}/10
              </Badge>
              <Badge className="bg-white/15 text-white border-none backdrop-blur">
                Difficulty {topTask.difficulty}/10
              </Badge>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  onClick={() => {
                    const prompt = [
                      "You are an SEO expert. Help me fix this issue on my website.",
                      "",
                      `Task: ${topTask.title}`,
                      topTask.page ? `Page: ${topTask.page}` : "",
                      "",
                      topTask.explanation,
                    ].filter(Boolean).join("\n");
                    navigator.clipboard.writeText(prompt).then(() =>
                      toast.success("Prompt copied — paste into Claude")
                    );

                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Prompt
                </Button>
                {topTask.page && (
                  <Button
                    size="sm"
                    className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-full"
                    render={
                      <Link
                        href={`/content-refresh?url=${encodeURIComponent(topTask.page)}`}
                      />
                    }
                    nativeButton={false}
                  >
                    Start with Content Refresh
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
          <CardContent className="py-8 text-center text-slate-500 text-sm">
            No tasks yet — once data is imported, your daily plan appears here.
          </CardContent>
        </Card>
      )}

      {/* Performance stats */}
      {snapshot && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Clicks (28d)"
            value={snapshot.summary.clicks.toLocaleString()}
            delta={<DeltaBadge delta={snapshot.summary.clicksDelta} />}
            icon={MousePointerClick}
          />
          <StatCard
            label="Impressions"
            value={snapshot.summary.impressions.toLocaleString()}
            delta={<DeltaBadge delta={snapshot.summary.impressionsDelta} />}
            icon={Eye}
          />
          <StatCard
            label="Avg CTR"
            value={`${(snapshot.summary.ctr * 100).toFixed(2)}%`}
            icon={Zap}
          />
          <StatCard
            label="Avg Position"
            value={snapshot.summary.position.toFixed(1)}
            icon={Gauge}
          />
        </div>
      )}

      {/* Remaining task list */}
      {tasks.length > 1 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <ListChecks className="w-5 h-5 text-indigo-600" />
              Rest of today&apos;s plan
            </h2>
          </div>
          <div className="space-y-3">
            {tasks.slice(1).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Opportunity sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Traffic Declines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {declines.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                No significant declines detected. Nice work.
              </p>
            ) : (
              declines.slice(0, 3).map((o) => <MiniOpportunity key={o.id} opportunity={o} />)
            )}
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mt-3"
            >
              View all opportunities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Zap className="w-4 h-4 text-emerald-500" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quickWins.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                No quick wins detected yet — check back after more data is imported.
              </p>
            ) : (
              quickWins.slice(0, 3).map((o) => <MiniOpportunity key={o.id} opportunity={o} />)
            )}
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mt-3"
            >
              View all opportunities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Link2 className="w-4 h-4 text-indigo-500" />
              Internal Link Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crawl ? (
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{crawl.orphanPages.length}</span>{" "}
                  orphan pages and{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{crawl.weakPages.length}</span>{" "}
                  weakly linked pages found across {crawl.pages.length} crawled pages.
                </p>
                <p>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {crawl.suggestions.length}
                  </span>{" "}
                  link placements suggested.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4">
                Run a sitemap crawl to find orphan pages and link opportunities.
              </p>
            )}
            <Link
              href="/internal-links"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mt-3"
            >
              {crawl ? "View link suggestions" : "Crawl your sitemap"}{" "}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <RefreshCw className="w-4 h-4 text-violet-500" />
              Content Refresh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {declines.length > 0
                ? `${declines.length} declining ${declines.length === 1 ? "page needs" : "pages need"} a refresh. Get AI-drafted titles, sections, and FAQs for any URL.`
                : "Get AI-drafted titles, missing topics, new sections, and FAQs for any page on your site."}
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <Link
                href="/content-refresh"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Refresh a page <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/coach"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Ask the AI Coach
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
