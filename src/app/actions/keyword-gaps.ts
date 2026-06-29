"use server";

import { getConnectionStatus, getUserId } from "@/lib/services/session";
import { getUsageStatus } from "@/lib/services/usage";
import { getCachedSnapshot } from "@/lib/db";
import { getDemoSnapshot } from "@/lib/demo-data";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildKeywordClustersPrompt } from "@/lib/prompts/keyword-clusters";
import { cached } from "@/lib/services/store";
import type { KeywordCluster, KeywordClustersResult, QueryPerformance } from "@/lib/types";

export async function getKeywordClusters(): Promise<KeywordClustersResult> {
  const [status, usage, userId] = await Promise.all([
    getConnectionStatus(),
    getUsageStatus(),
    getUserId(),
  ]);

  if (usage.blocked) {
    throw new Error("You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access.");
  }

  let queries: QueryPerformance[];
  let isDemo = false;

  if (status.demo) {
    queries = getDemoSnapshot().queries;
    isDemo = true;
  } else if (status.connected && status.property) {
    const snap = await getCachedSnapshot(status.property, userId ?? undefined);
    if (!snap) throw new Error("No Search Console data found. Visit the Dashboard to import your data first.");
    queries = (snap as { queries: QueryPerformance[] }).queries ?? [];
  } else {
    throw new Error("Connect Google Search Console first.");
  }

  if (!queries.length) throw new Error("No query data available yet.");

  const topQueries = [...queries].sort((a, b) => b.impressions - a.impressions).slice(0, 200);
  const queryMap = new Map(topQueries.map((q) => [q.query.toLowerCase(), q]));

  const day = new Date().toISOString().slice(0, 10);
  const cacheKey = `clusters:${status.property ?? "demo"}:${day}`;

  return cached(cacheKey, 12 * 60 * 60 * 1000, async () => {
    const result = await jsonCompletion<{ clusters: { name: string; queries: string[] }[] }>(
      buildKeywordClustersPrompt(topQueries),
      { userId: userId ?? undefined, feature: "clusters" }
    );

    const clusters: KeywordCluster[] = (result.clusters ?? [])
      .map((c) => {
        const enriched = c.queries
          .map((q) => queryMap.get(q.toLowerCase()))
          .filter((q): q is QueryPerformance => q != null);

        const totalImpressions = enriched.reduce((s, q) => s + q.impressions, 0);
        const avgPosition =
          totalImpressions > 0
            ? enriched.reduce((s, q) => s + q.position * q.impressions, 0) / totalImpressions
            : 0;

        const topQ = [...enriched].sort((a, b) => b.impressions - a.impressions).slice(0, 10);

        return {
          name: c.name,
          queries: c.queries,
          topQueries: topQ.map((q) => ({
            query: q.query,
            impressions: q.impressions,
            position: q.position,
            clicks: q.clicks,
          })),
          totalImpressions,
          avgPosition,
        };
      })
      .filter((c) => c.totalImpressions > 0)
      .sort((a, b) => b.totalImpressions - a.totalImpressions);

    return { clusters, generatedAt: Date.now(), demo: isDemo };
  });
}
