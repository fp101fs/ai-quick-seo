import type { QueryPerformance } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

export function buildKeywordClustersPrompt(queries: QueryPerformance[]): AiMessage[] {
  const queryLines = queries
    .map((q) => `- "${q.query}" (${q.impressions.toLocaleString()} impr, pos ${q.position.toFixed(1)})`)
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are an SEO analyst. Group search queries into named topic clusters. Every query must appear in exactly one cluster. Cluster names should describe the topic theme concisely (2–4 words).",
    },
    {
      role: "user",
      content: `Group these ${queries.length} queries into 8–15 named topic clusters.

${queryLines}

Return ONLY valid JSON, no markdown fences:
{
  "clusters": [
    { "name": "cluster name (2-4 words)", "queries": ["exact query text", ...] }
  ]
}

Rules:
- 8–15 clusters total
- Every query must appear in exactly one cluster
- Names describe the topic theme, not just echo the keywords
- Sort clusters by total impressions descending (you can estimate from the data)`,
    },
  ];
}
