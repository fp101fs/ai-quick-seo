// Resolves the current site context (GSC snapshot, opportunities, crawl)
// for the active session — real data when connected, demo data in demo mode.

import { cookies } from "next/headers";
import type { CrawlResult, GscSnapshot, Opportunity } from "@/lib/types";
import { getDemoCrawl, getDemoSnapshot } from "@/lib/demo-data";
import { getValidAccessToken } from "@/lib/services/google-auth";
import { detectOpportunities, getSnapshot } from "@/lib/services/gsc";
import { getSelectedProperty, getTokens, getUserId, isDemoMode } from "@/lib/services/session";
import { cacheGet } from "@/lib/services/store";

export const SITEMAP_COOKIE = "sitemap_url";

// Lazy DB helpers — dynamic import so a missing POSTGRES_URL never breaks GSC
async function tryGetCachedSnapshot(property: string, userId?: number): Promise<GscSnapshot | null> {
  try {
    const { getCachedSnapshot } = await import("@/lib/db");
    const cached = await getCachedSnapshot(property, userId);
    return cached as GscSnapshot | null;
  } catch {
    return null;
  }
}

async function trySaveCachedSnapshot(property: string, snapshot: GscSnapshot, userId?: number): Promise<void> {
  try {
    const { setCachedSnapshot } = await import("@/lib/db");
    await setCachedSnapshot(property, snapshot, userId);
  } catch {
    // Silently ignore — in-memory cache is the fallback
  }
}

export async function getCurrentSnapshot(): Promise<GscSnapshot | null> {
  if (await isDemoMode()) return getDemoSnapshot();

  const [tokens, property, userId] = await Promise.all([getTokens(), getSelectedProperty(), getUserId()]);
  if (!tokens || !property) return null;

  // Try DB cache first (survives cold starts and property re-selection)
  const uid = userId ?? undefined;
  const cached = await tryGetCachedSnapshot(property, uid);
  if (cached) return cached;

  const accessToken = await getValidAccessToken();
  const snapshot = await getSnapshot(accessToken, property);

  // Persist to DB for future re-selections (fire and forget)
  if (snapshot) {
    trySaveCachedSnapshot(property, snapshot, uid);
  }

  return snapshot;
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
