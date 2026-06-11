// Google Search Console data import and opportunity detection.
// Detection is deterministic (fast, free); AI is reserved for
// prioritization, content refresh, and the coach.

import type {
  GscProperty,
  GscRow,
  GscSnapshot,
  Opportunity,
  PagePerformance,
  QueryPerformance,
} from "@/lib/types";
import { cached } from "@/lib/services/store";

const GSC_API = "https://www.googleapis.com/webmasters/v3";
const RANGE_DAYS = 28;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function listProperties(accessToken: string): Promise<GscProperty[]> {
  const response = await fetch(`${GSC_API}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("GSC sites list failed:", errorText);
    throw new Error("Failed to load Search Console properties");
  }
  const data = await response.json();
  return (data.siteEntry ?? [])
    .filter((s: { permissionLevel: string }) => s.permissionLevel !== "siteUnverifiedUser")
    .map((s: { siteUrl: string; permissionLevel: string }) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    }));
}

async function queryAnalytics(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>
): Promise<GscRow[]> {
  const response = await fetch(
    `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error("GSC query failed:", errorText);
    throw new Error("Failed to import Search Console data");
  }
  const data = await response.json();
  return data.rows ?? [];
}

/**
 * Imports the last 28 days (vs. the prior 28 days) of performance data.
 * Cached in memory for 10 minutes per property.
 */
export async function getSnapshot(
  accessToken: string,
  siteUrl: string
): Promise<GscSnapshot> {
  return cached(`gsc:${siteUrl}`, 10 * 60 * 1000, async () => {
    // GSC data lags ~2 days behind.
    const end = new Date(Date.now() - 2 * 86400_000);
    const start = new Date(end.getTime() - RANGE_DAYS * 86400_000);
    const prevEnd = new Date(start.getTime() - 86400_000);
    const prevStart = new Date(prevEnd.getTime() - RANGE_DAYS * 86400_000);

    const range = { startDate: formatDate(start), endDate: formatDate(end) };
    const prevRange = { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) };

    const [curPages, prevPages, curQueries] = await Promise.all([
      queryAnalytics(accessToken, siteUrl, { ...range, dimensions: ["page"], rowLimit: 200 }),
      queryAnalytics(accessToken, siteUrl, { ...prevRange, dimensions: ["page"], rowLimit: 200 }),
      queryAnalytics(accessToken, siteUrl, { ...range, dimensions: ["query", "page"], rowLimit: 250 }),
    ]);

    const prevByPage = new Map(prevPages.map((r) => [r.keys[0], r]));

    const pages: PagePerformance[] = curPages.map((row) => {
      const prev = prevByPage.get(row.keys[0]);
      return {
        url: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        prevClicks: prev?.clicks ?? 0,
        prevImpressions: prev?.impressions ?? 0,
        clicksDelta: row.clicks - (prev?.clicks ?? 0),
        impressionsDelta: row.impressions - (prev?.impressions ?? 0),
      };
    });

    const queries: QueryPerformance[] = curQueries.map((row) => ({
      query: row.keys[0],
      page: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    const totals = (rows: GscRow[]) =>
      rows.reduce(
        (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }),
        { clicks: 0, impressions: 0 }
      );
    const cur = totals(curPages);
    const prev = totals(prevPages);
    const avgPosition =
      pages.length > 0
        ? pages.reduce((s, p) => s + p.position * p.impressions, 0) /
          Math.max(1, pages.reduce((s, p) => s + p.impressions, 0))
        : 0;

    return {
      property: siteUrl,
      rangeDays: RANGE_DAYS,
      summary: {
        clicks: cur.clicks,
        impressions: cur.impressions,
        ctr: cur.impressions > 0 ? cur.clicks / cur.impressions : 0,
        position: avgPosition,
        prevClicks: prev.clicks,
        prevImpressions: prev.impressions,
        clicksDelta: cur.clicks - prev.clicks,
        impressionsDelta: cur.impressions - prev.impressions,
      },
      pages,
      queries,
      fetchedAt: Date.now(),
    };
  });
}

// ---------- Opportunity detection ----------

const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;
const pagePath = (url: string) => {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
};

export function detectOpportunities(snapshot: GscSnapshot): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Pages losing clicks (>=20% drop with meaningful volume).
  const decliningClicks = snapshot.pages
    .filter((p) => p.prevClicks >= 20 && p.clicksDelta / p.prevClicks <= -0.2)
    .sort((a, b) => a.clicksDelta - b.clicksDelta)
    .slice(0, 6);
  for (const p of decliningClicks) {
    const change = p.clicksDelta / p.prevClicks;
    opportunities.push({
      id: `decline-clicks:${p.url}`,
      type: "declining-clicks",
      impact: change <= -0.35 || p.prevClicks >= 500 ? "high" : "medium",
      page: p.url,
      issue: `${pagePath(p.url)} lost ${Math.abs(p.clicksDelta)} clicks (${pct(change)}) over the last ${snapshot.rangeDays} days`,
      whyItMatters:
        "A sustained click decline usually means competitors published fresher content or Google re-evaluated the page. Left alone, declines tend to compound as engagement signals weaken.",
      recommendedAction:
        "Refresh the content: update facts and dates, expand thin sections, and re-check that the title still matches search intent. Use the Content Refresh tool on this URL.",
      estimatedImpact: `Recovering previous performance is worth ~${Math.abs(p.clicksDelta)} clicks per ${snapshot.rangeDays} days.`,
      metrics: { clicks: p.clicks, clicksDelta: p.clicksDelta, position: p.position },
    });
  }

  // Pages losing impressions (visibility loss before clicks drop).
  const decliningImpressions = snapshot.pages
    .filter(
      (p) =>
        p.prevImpressions >= 500 &&
        p.impressionsDelta / p.prevImpressions <= -0.2 &&
        !decliningClicks.includes(p)
    )
    .sort((a, b) => a.impressionsDelta - b.impressionsDelta)
    .slice(0, 4);
  for (const p of decliningImpressions) {
    const change = p.impressionsDelta / p.prevImpressions;
    opportunities.push({
      id: `decline-impr:${p.url}`,
      type: "declining-impressions",
      impact: "medium",
      page: p.url,
      issue: `${pagePath(p.url)} lost ${Math.abs(p.impressionsDelta).toLocaleString()} impressions (${pct(change)})`,
      whyItMatters:
        "Impression loss is an early warning: the page is being shown for fewer queries or at lower positions. Clicks usually follow the same trajectory within weeks.",
      recommendedAction:
        "Check which queries dropped, then broaden the page's topical coverage with new sections targeting those queries. Add internal links from related pages to reinforce relevance.",
      estimatedImpact: `Restoring visibility protects ~${Math.round((Math.abs(p.impressionsDelta) * snapshot.summary.ctr))} clicks per period.`,
      metrics: { impressions: p.impressions, impressionsDelta: p.impressionsDelta, position: p.position },
    });
  }

  // Quick wins: queries ranking 5–20 with real impression volume.
  const quickWins = snapshot.queries
    .filter((q) => q.position >= 5 && q.position <= 20 && q.impressions >= 300)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);
  for (const q of quickWins) {
    const nearPageOne = q.position <= 10;
    opportunities.push({
      id: `quick-win:${q.query}`,
      type: "quick-win",
      impact: q.impressions >= 5000 ? "high" : "medium",
      page: q.page,
      query: q.query,
      issue: `"${q.query}" ranks at position ${q.position.toFixed(1)} with ${q.impressions.toLocaleString()} impressions`,
      whyItMatters: nearPageOne
        ? "Positions 5–10 sit below the fold where CTR falls off a cliff. Small relevance gains here produce outsized click growth — this is the cheapest traffic you can win."
        : "Page-2 rankings mean Google already considers the page relevant; it just needs a stronger signal to break onto page 1, where ~90% of clicks happen.",
      recommendedAction: q.page
        ? `Strengthen ${pagePath(q.page)} for this query: mention it in the H1/title, add a dedicated section answering it, and point 2–3 internal links at the page with this phrase as anchor text.`
        : "Identify the ranking page and strengthen it for this query with on-page mentions and internal links.",
      estimatedImpact: `Moving to position ~3 could add ~${Math.round(q.impressions * 0.08)} clicks per ${snapshot.rangeDays} days.`,
      metrics: { impressions: q.impressions, position: q.position, ctr: q.ctr },
    });
  }

  // High impressions, low CTR (snippet problem).
  const lowCtr = snapshot.pages
    .filter((p) => p.impressions >= 1000 && p.position <= 12 && p.ctr < 0.02)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);
  for (const p of lowCtr) {
    opportunities.push({
      id: `low-ctr:${p.url}`,
      type: "low-ctr",
      impact: p.impressions >= 10000 ? "high" : "medium",
      page: p.url,
      issue: `${pagePath(p.url)} gets ${p.impressions.toLocaleString()} impressions but only ${(p.ctr * 100).toFixed(1)}% CTR at position ${p.position.toFixed(1)}`,
      whyItMatters:
        "People see this page in results but don't click. The title tag or meta description isn't selling the click — that's free traffic being left on the table without any ranking improvement needed.",
      recommendedAction:
        "Rewrite the title tag and meta description: lead with the benefit, include the year or a number, and match the dominant search intent. The Content Refresh tool will draft these for you.",
      estimatedImpact: `Lifting CTR to 3% would add ~${Math.round(p.impressions * (0.03 - p.ctr))} clicks per ${snapshot.rangeDays} days.`,
      metrics: { impressions: p.impressions, ctr: p.ctr, position: p.position },
    });
  }

  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return opportunities.sort((a, b) => order[a.impact] - order[b.impact]);
}
