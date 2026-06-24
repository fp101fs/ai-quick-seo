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

  const [{ snapshot, opportunities }, crawl] = await Promise.all([
    getCurrentOpportunities(),
    getCachedCrawl(),
  ]);

  const tasks = await generateDailyTasks(
    status.property ?? "default",
    opportunities,
    crawl?.suggestions ?? []
  );

  // Save to DB (fire and forget, skip for demo)
  if (!status.demo && status.property) {
    getUserId()
      .then(async (userId) => {
        if (!userId) return;
        const { saveAnalysis } = await import("@/lib/db");
        saveAnalysis(userId, status.property!, { tasks, opportunities, snapshot, crawl });
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

  const result = await crawlSitemap(target);

  // Remember the sitemap so the dashboard can surface link opportunities.
  const store = await cookies();
  store.set(SITEMAP_COOKIE, target, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

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
  return getCachedCrawl();
}

export async function clearSnapshotCache(): Promise<void> {
  const property = await getSelectedProperty();
  if (!property) return;
  cacheDelete(`gsc:${property}`);
  // Also bust the AI-generated tasks cache so new task URLs are regenerated
  const day = new Date().toISOString().slice(0, 10);
  cacheDelete(`tasks:${property}:${day}`);
  try {
    const { deleteCachedSnapshot } = await import("@/lib/db");
    await deleteCachedSnapshot(property);
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
  const result = await analyzeContentRefresh(target, snapshot);

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
