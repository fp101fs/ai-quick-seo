import type { AiMessage } from "@/lib/services/openrouter";
import type { GscSnapshot } from "@/lib/types";

export function buildArticleIdeasPrompt(snapshot: GscSnapshot): AiMessage[] {
  const topQueries = snapshot.queries
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 40)
    .map((q) => `- "${q.query}" (${q.impressions} impressions, position ${q.position.toFixed(1)})`)
    .join("\n");

  const topPages = snapshot.pages
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
    .map((p) => {
      const path = (() => { try { return new URL(p.url).pathname; } catch { return p.url; } })();
      return `- ${path} (${p.clicks} clicks)`;
    })
    .join("\n");

  return [
    {
      role: "system",
      content: `You are an expert SEO content strategist. Analyze a site's existing Search Console data and identify high-opportunity article ideas for topics the site does NOT yet cover.

Return ONLY a valid JSON object matching this exact schema:
{
  "niche": "string (1 sentence describing the site's niche)",
  "existingTopics": ["string", ...] (5-8 main topic clusters already covered),
  "ideas": [
    {
      "rank": 1,
      "title": "string (compelling, SEO-optimized article title)",
      "targetKeyword": "string (primary keyword to rank for)",
      "intent": "informational" | "commercial" | "navigational" | "transactional",
      "reasoning": "string (1-2 sentences why this gap exists and why this article would rank)",
      "estimatedOpportunity": "high" | "medium" | "low"
    }
    // ... 15 total ideas, ranked by estimated opportunity
  ]
}`,
    },
    {
      role: "user",
      content: `Analyze this site's Search Console data and generate 15 article ideas for topics NOT yet covered.

TOP QUERIES THIS SITE ALREADY RANKS FOR:
${topQueries}

TOP PAGES BY CLICKS:
${topPages}

Instructions:
1. Infer the site's niche from the queries and pages
2. Identify topic clusters already covered
3. Find keyword gaps — related topics with search demand that are NOT covered
4. Generate 15 article ideas targeting those gaps
5. Prioritize: high search volume, informational/commercial intent, achievable ranking difficulty
6. Each title should be specific, compelling, and 50-70 characters
7. Do NOT suggest articles similar to existing pages — they must be genuinely new topics

Return the JSON object only, no other text.`,
    },
  ];
}
