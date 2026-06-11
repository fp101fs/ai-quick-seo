import type { QueryPerformance } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

export function buildContentRefreshPrompt(
  url: string,
  content: string,
  queries: QueryPerformance[]
): AiMessage[] {
  const metricsBlock =
    queries.length > 0
      ? `Search Console queries this page currently ranks for:
${queries
  .map(
    (q) =>
      `- "${q.query}": position ${q.position.toFixed(1)}, ${q.impressions} impressions, ${q.clicks} clicks, ${(q.ctr * 100).toFixed(1)}% CTR`
  )
  .join("\n")}`
      : "No Search Console data is available for this page.";

  return [
    {
      role: "system",
      content:
        "You are an expert SEO content strategist. You produce specific, actionable refresh plans — never generic advice. Title tags are under 60 characters; meta descriptions are under 155 characters and lead with the benefit.",
    },
    {
      role: "user",
      content: `Analyze this page and produce a content refresh plan.

URL: ${url}

${metricsBlock}

Page content (markdown):
${content.substring(0, 12000)}

Respond with ONLY a JSON object in this exact format, no markdown fences or preamble:
{
  "missingTopics": ["topic the page should cover but doesn't", ...],
  "suggestedH2s": ["specific H2 heading to add", ...],
  "faq": [{ "question": "...", "answer": "2-3 sentence answer" }, ...],
  "titleTag": { "current": "the page's current title", "suggested": "improved title under 60 chars" },
  "metaDescription": { "current": "current meta description or empty string", "suggested": "improved description under 155 chars" },
  "contentAdditions": ["specific paragraph or section to add, described concretely", ...]
}

Give 3-6 items per list. Prioritize changes that target the queries with high impressions but weak position or CTR.`,
    },
  ];
}
