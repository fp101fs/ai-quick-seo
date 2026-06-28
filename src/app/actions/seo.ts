"use server";

import { cookies } from "next/headers";
import type {
  ConnectionStatus,
  ContentRefreshResult,
  CrawlResult,
  GscSnapshot,
  Opportunity,
  SeoTask,
} from "@/lib/types";
import { getDemoCrawl } from "@/lib/demo-data";
import { analyzeContentRefresh } from "@/lib/services/content-refresh";
import {
  getCachedCrawl,
  getCurrentOpportunities,
  getCurrentSnapshot,
  SITEMAP_COOKIE,
} from "@/lib/services/context";
import { crawlSitemap } from "@/lib/services/crawler";
import { cacheDelete } from "@/lib/services/store";
import { getConnectionStatus, getSelectedProperty, getUserId, isDemoMode } from "@/lib/services/session";
import { generateDailyTasks } from "@/lib/services/tasks";

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function getGscQueries(): Promise<GscQueryRow[]> {
  try {
    const snap = await getCurrentSnapshot();
    if (!snap?.queries?.length) return [];
    // Aggregate: same query appears per-page, merge by summing clicks/impressions, weighted-avg position
    const map = new Map<string, { clicks: number; impressions: number; posSum: number }>();
    for (const q of snap.queries) {
      const k = q.query.toLowerCase();
      const e = map.get(k) ?? { clicks: 0, impressions: 0, posSum: 0 };
      e.clicks += q.clicks;
      e.impressions += q.impressions;
      e.posSum += q.position * q.impressions; // impression-weighted
      map.set(k, e);
    }
    return Array.from(map.entries())
      .map(([query, e]) => ({
        query,
        clicks: e.clicks,
        impressions: e.impressions,
        ctr: e.impressions > 0 ? e.clicks / e.impressions : 0,
        position: e.impressions > 0 ? e.posSum / e.impressions : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 100);
  } catch { return []; }
}

export interface CannibalRow {
  query: string;
  totalClicks: number;
  pages: { url: string; clicks: number; position: number }[];
}

export async function getCannibalization(): Promise<CannibalRow[]> {
  try {
    const snap = await getCurrentSnapshot();
    if (!snap?.queries?.length) return [];
    const map = new Map<string, Map<string, { clicks: number; posSum: number; impressions: number }>>();
    for (const q of snap.queries) {
      if (!q.page) continue;
      if (!map.has(q.query)) map.set(q.query, new Map());
      const pages = map.get(q.query)!;
      const e = pages.get(q.page) ?? { clicks: 0, posSum: 0, impressions: 0 };
      e.clicks += q.clicks;
      e.posSum += q.position * q.impressions;
      e.impressions += q.impressions;
      pages.set(q.page, e);
    }
    return Array.from(map.entries())
      .filter(([, pages]) => pages.size >= 2)
      .map(([query, pages]) => {
        const pageList = Array.from(pages.entries()).map(([url, d]) => ({
          url,
          clicks: d.clicks,
          position: d.impressions > 0 ? d.posSum / d.impressions : 0,
        })).sort((a, b) => a.position - b.position);
        return { query, totalClicks: pageList.reduce((s, p) => s + p.clicks, 0), pages: pageList };
      })
      .sort((a, b) => b.totalClicks - a.totalClicks);
  } catch { return []; }
}

export interface DashboardData {
  status: ConnectionStatus;
  snapshot: GscSnapshot | null;
  opportunities: Opportunity[];
  tasks: SeoTask[];
  crawl: CrawlResult | null;
  fromCache?: boolean;
}

export async function getDashboardData(opts?: { forceRefresh?: boolean }): Promise<DashboardData> {
  const status = await getConnectionStatus();
  if (!status.demo && (!status.connected || !status.property)) {
    return { status, snapshot: null, opportunities: [], tasks: [], crawl: null };
  }

  if (opts?.forceRefresh) {
    await clearSnapshotCache().catch(() => {});
  }

  // Check DB analysis cache (skip for demo and force refresh)
  if (!opts?.forceRefresh && !status.demo && status.property) {
    try {
      const { getLatestAnalysis } = await import("@/lib/db");
      const userId = await getUserId();
      if (userId) {
        const cached = await getLatestAnalysis(userId, status.property);
        if (cached) {
          return {
            status,
            snapshot: cached.snapshot as GscSnapshot | null,
            opportunities: cached.opportunities as Opportunity[],
            tasks: cached.tasks as SeoTask[],
            crawl: cached.crawl as CrawlResult | null,
            fromCache: true,
          };
        }
      }
    } catch {
      // DB unavailable — fall through to fresh analysis
    }
  }

  const [{ snapshot, opportunities }, crawl, dashUserId] = await Promise.all([
    getCurrentOpportunities(),
    getCachedCrawl(),
    getUserId().catch(() => null),
  ]);

  // Warm homepage metadata cache so article ideas don't need an extra fetch
  if (!status.demo && status.property) {
    const metaUrl = status.property.startsWith("sc-domain:")
      ? `https://${status.property.replace("sc-domain:", "")}`
      : status.property.replace(/\/$/, "");
    import("@/lib/services/site-metadata")
      .then(({ fetchSiteMetadata }) => fetchSiteMetadata(metaUrl))
      .catch(() => {});
  }

  const tasks = await generateDailyTasks(
    status.property ?? "default",
    opportunities,
    crawl?.suggestions ?? [],
    dashUserId ?? undefined
  );

  // Save to DB (fire and forget, skip for demo)
  if (!status.demo && status.property) {
    getUserId()
      .then(async (userId) => {
        if (!userId) return;
        const { saveAnalysis } = await import("@/lib/db");
        await saveAnalysis(userId, status.property!, { tasks, opportunities, snapshot, crawl }).catch(() => {});
      })
      .catch(() => {});
  }

  return { status, snapshot, opportunities, tasks, crawl };
}

export async function getAnalysisHistory() {
  try {
    const { getAnalysisHistory: dbGetHistory } = await import("@/lib/db");
    const userId = await getUserId();
    if (!userId) return [];
    return dbGetHistory(userId);
  } catch {
    return [];
  }
}

export async function getOpportunities(): Promise<{
  status: ConnectionStatus;
  snapshot: GscSnapshot | null;
  opportunities: Opportunity[];
}> {
  const status = await getConnectionStatus();
  if (!status.demo && (!status.connected || !status.property)) {
    return { status, snapshot: null, opportunities: [] };
  }
  const { snapshot, opportunities } = await getCurrentOpportunities();
  return { status, snapshot, opportunities };
}

export async function runCrawl(sitemapUrl: string): Promise<CrawlResult> {
  if (await isDemoMode()) return getDemoCrawl();

  if (!sitemapUrl) throw new Error("Sitemap URL is required");
  let target = sitemapUrl.trim();
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `https://${target}`;
  }

  const crawlUserId = await getUserId().catch(() => null);
  const result = await crawlSitemap(target, crawlUserId ?? undefined);

  // Remember the sitemap so the dashboard can surface link opportunities.
  const store = await cookies();
  store.set(SITEMAP_COOKIE, target, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Persist to DB so results survive cold serverless instances
  if (crawlUserId) {
    const { saveCrawlResult } = await import("@/lib/db");
    await saveCrawlResult(crawlUserId, result).catch(() => {});
  }

  return result;
}

export async function getPropertyBaseUrl(): Promise<string | null> {
  const property = await getSelectedProperty();
  if (!property) return null;
  if (property.startsWith("sc-domain:")) {
    return `https://${property.replace("sc-domain:", "")}`;
  }
  return property.replace(/\/$/, "");
}

export async function getLastCrawl(): Promise<CrawlResult | null> {
  const cached = await getCachedCrawl();
  if (cached) return cached;
  // Fall back to DB when in-memory cache is cold
  const [userId, baseUrl] = await Promise.all([
    getUserId().catch(() => null),
    getPropertyBaseUrl().catch(() => null),
  ]);
  if (!userId) return null;
  try {
    const { getCrawlResult } = await import("@/lib/db");
    const result = (await getCrawlResult(userId)) as CrawlResult | null;
    if (!result || !baseUrl) return result;
    // Verify crawl belongs to current property
    if (result.origin && !result.origin.startsWith(baseUrl) && !baseUrl.startsWith(result.origin)) return null;
    return result;
  } catch {
    return null;
  }
}

export async function clearSnapshotCache(): Promise<void> {
  const property = await getSelectedProperty();
  if (!property) return;
  cacheDelete(`gsc:${property}`);
  // Also bust the AI-generated tasks cache so new task URLs are regenerated
  const day = new Date().toISOString().slice(0, 10);
  cacheDelete(`tasks:${property}:${day}:v2`);
  try {
    const [{ deleteCachedSnapshot }, userId] = await Promise.all([import("@/lib/db"), getUserId()]);
    await deleteCachedSnapshot(property, userId ?? undefined);
  } catch {
    // DB unavailable — in-memory clear is sufficient
  }
}

export async function refreshContent(url: string): Promise<ContentRefreshResult> {
  if (!url) throw new Error("URL is required");

  const { getUsageStatus } = await import("@/lib/services/usage");
  const usage = await getUsageStatus();
  if (usage.blocked) {
    throw new Error("You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access.");
  }
  let target = url.trim();

  // Resolve relative paths against the connected property domain
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    const property = await getSelectedProperty();
    const base = property && !property.startsWith("sc-domain:")
      ? property.replace(/\/$/, "")
      : null;

    if (base) {
      target = target.startsWith("/") ? `${base}${target}` : `${base}/${target}`;
    } else if (property?.startsWith("sc-domain:")) {
      const domain = property.replace("sc-domain:", "");
      target = target.startsWith("/") ? `https://${domain}${target}` : `https://${domain}/${target}`;
    } else {
      target = `https://${target}`;
    }
  }

  const snapshot = await getCurrentSnapshot().catch(() => null);
  const result = await analyzeContentRefresh(target, snapshot, usage.userId ?? undefined);

  // Save to cache (best-effort)
  const userId = await getUserId();
  if (userId) {
    const { saveContentRefresh } = await import("@/lib/db");
    await saveContentRefresh(userId, target, result).catch(() => {});
  }

  return result;
}

export async function getContentRefreshCache(
  url: string
): Promise<{ result: ContentRefreshResult; generatedAt: string } | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { getContentRefresh } = await import("@/lib/db");
  const row = await getContentRefresh(userId, url);
  if (!row) return null;
  return { result: row.result as ContentRefreshResult, generatedAt: row.generated_at };
}

export async function getSitemapPages(): Promise<string[]> {
  try {
    const snap = await getCurrentSnapshot();
    return (snap?.pages ?? []).sort((a, b) => b.clicks - a.clicks).map((p) => p.url);
  } catch { return []; }
}

export async function getNavCounts(): Promise<Record<string, number>> {
  try {
    const [userId, status] = await Promise.all([getUserId(), getConnectionStatus()]);
    if (!userId) return {};
    const property = status.demo ? "demo" : status.property;
    if (!property) return {};
    const {
      getLatestAnalysis, getLatestArticleIdeas, getTrackedKeywords,
      getPageGradeCount, getContentRefreshCount,
    } = await import("@/lib/db");
    const [analysis, ideas, keywords, gradeCount, refreshCount, inMemoryCrawl] = await Promise.all([
      getLatestAnalysis(userId, property).catch(() => null),
      getLatestArticleIdeas(userId, property).catch(() => null),
      getTrackedKeywords(userId, status.demo ? "demo" : (property ?? "")).catch(() => []),
      getPageGradeCount(userId).catch(() => 0),
      getContentRefreshCount(userId).catch(() => 0),
      getCachedCrawl().catch(() => null),
    ]);
    // Fall back to DB for crawl when in-memory cache is cold
    const { getCrawlResult } = await import("@/lib/db");
    const crawl = inMemoryCrawl ?? await getCrawlResult(userId).catch(() => null);
    const snap = analysis?.snapshot as { queries?: { query: string }[]; pages?: unknown[] } | null;
    const uniqueKeywords = snap?.queries ? new Set(snap.queries.map((q) => q.query.toLowerCase())).size : 0;
    const sitemapPages = snap?.pages?.length ?? 0;
    const counts: Record<string, number> = {};
    let opps = (analysis?.opportunities as unknown[] | null)?.length ?? 0;
    // If no cached analysis, fall back to live opportunities from snapshot
    if (!opps) {
      const { opportunities } = await getCurrentOpportunities().catch(() => ({ opportunities: [] }));
      opps = opportunities.length;
    }
    const tasks = (analysis?.tasks as unknown[] | null)?.length ?? 0;
    const ideaCount = ((ideas as { ideas?: unknown[] } | null)?.ideas)?.length ?? 0;
    const suggestions = (crawl as { suggestions?: unknown[] } | null)?.suggestions?.length ?? 0;
    if (opps) counts["/opportunities"] = opps;
    if (tasks) counts["/action-plan"] = tasks;
    if (ideaCount) counts["/article-ideas"] = ideaCount;
    if (keywords.length) counts["/rank-tracking"] = keywords.length;
    if (uniqueKeywords) counts["/keywords"] = uniqueKeywords;
    if (refreshCount) counts["/content-refresh"] = refreshCount;
    if (suggestions) counts["/internal-links"] = suggestions;
    if (gradeCount) counts["/page-grader"] = gradeCount;
    if (sitemapPages) counts["/sitemap-explorer"] = sitemapPages;
    return counts;
  } catch {
    return {};
  }
}

export async function getRefreshedPages(): Promise<{ url: string; generated_at: string }[]> {
  const [userId, baseUrl] = await Promise.all([
    getUserId().catch(() => null),
    getPropertyBaseUrl().catch(() => null),
  ]);
  if (!userId) return [];
  const { getAllContentRefreshUrls } = await import("@/lib/db");
  return getAllContentRefreshUrls(userId, baseUrl ?? undefined).catch(() => []);
}

export async function saveCompetitor(url: string, report: unknown): Promise<void> {
  const userId = await getUserId().catch(() => null);
  if (!userId) return;
  const { saveCompetitorReport } = await import("@/lib/db");
  await saveCompetitorReport(userId, url, report).catch(() => {});
}

export async function getLastCompetitor(): Promise<{ url: string; report: unknown } | null> {
  const userId = await getUserId().catch(() => null);
  if (!userId) return null;
  try {
    const { getCompetitorReport } = await import("@/lib/db");
    return await getCompetitorReport(userId);
  } catch {
    return null;
  }
}

export async function getSuggestedRefreshPages(): Promise<string[]> {
  const userId = await getUserId();
  const status = await getConnectionStatus();
  if (!userId || (!status.demo && !status.property)) return [];
  const { getLatestAnalysis } = await import("@/lib/db");
  const cached = await getLatestAnalysis(userId, status.property ?? "demo");
  if (!cached) return [];
  const opps = (cached.opportunities as Opportunity[] | null) ?? [];
  return opps
    .filter((o) => (o.type === "declining-clicks" || o.type === "low-ctr") && o.page)
    .slice(0, 5)
    .map((o) => o.page!);
}
