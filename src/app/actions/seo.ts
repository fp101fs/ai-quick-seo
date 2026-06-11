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
import { getConnectionStatus, getSelectedProperty, isDemoMode } from "@/lib/services/session";
import { generateDailyTasks } from "@/lib/services/tasks";

export interface DashboardData {
  status: ConnectionStatus;
  snapshot: GscSnapshot | null;
  opportunities: Opportunity[];
  tasks: SeoTask[];
  crawl: CrawlResult | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const status = await getConnectionStatus();
  if (!status.demo && (!status.connected || !status.property)) {
    return { status, snapshot: null, opportunities: [], tasks: [], crawl: null };
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

  return { status, snapshot, opportunities, tasks, crawl };
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

export async function refreshContent(url: string): Promise<ContentRefreshResult> {
  if (!url) throw new Error("URL is required");
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
  return analyzeContentRefresh(target, snapshot);
}
