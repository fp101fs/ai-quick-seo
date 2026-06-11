// Resolves the current site context (GSC snapshot, opportunities, crawl)
// for the active session — real data when connected, demo data in demo mode.

import { cookies } from "next/headers";
import type { CrawlResult, GscSnapshot, Opportunity } from "@/lib/types";
import { getDemoCrawl, getDemoSnapshot } from "@/lib/demo-data";
import { getValidAccessToken } from "@/lib/services/google-auth";
import { detectOpportunities, getSnapshot } from "@/lib/services/gsc";
import { getSelectedProperty, getTokens, isDemoMode } from "@/lib/services/session";
import { cacheGet } from "@/lib/services/store";

export const SITEMAP_COOKIE = "sitemap_url";

export async function getCurrentSnapshot(): Promise<GscSnapshot | null> {
  if (await isDemoMode()) return getDemoSnapshot();

  const [tokens, property] = await Promise.all([getTokens(), getSelectedProperty()]);
  if (!tokens || !property) return null;

  const accessToken = await getValidAccessToken();
  return getSnapshot(accessToken, property);
}

export async function getCurrentOpportunities(): Promise<{
  snapshot: GscSnapshot | null;
  opportunities: Opportunity[];
}> {
  const snapshot = await getCurrentSnapshot();
  return {
    snapshot,
    opportunities: snapshot ? detectOpportunities(snapshot) : [],
  };
}

/**
 * Returns the most recent crawl for this session if it is still cached.
 * Never triggers a new crawl — pages that need one run it explicitly.
 */
export async function getCachedCrawl(): Promise<CrawlResult | null> {
  if (await isDemoMode()) return getDemoCrawl();

  const store = await cookies();
  const sitemapUrl = store.get(SITEMAP_COOKIE)?.value;
  if (!sitemapUrl) return null;
  return cacheGet<CrawlResult>(`crawl:${sitemapUrl}`);
}
