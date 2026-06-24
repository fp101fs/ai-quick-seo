import type { GscSnapshot, GradeResult, GradeCategory } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";
import { jsonCompletion } from "@/lib/services/openrouter";

const CATEGORY_META: Record<string, { name: string; emoji: string; maxScore: number }> = {
  "title-meta":          { name: "Title & Meta Description",  emoji: "🏷️",  maxScore: 15 },
  "headings":            { name: "Headings & Structure",       emoji: "📋",  maxScore: 10 },
  "content-depth":       { name: "Content Depth",              emoji: "📝",  maxScore: 15 },
  "search-performance":  { name: "Search Performance",         emoji: "📈",  maxScore: 15 },
  "internal-links":      { name: "Internal Links",             emoji: "🔗",  maxScore: 10 },
  "faq-questions":       { name: "Question Coverage",          emoji: "❓",  maxScore: 10 },
  "entity-signals":      { name: "Entity & Author Signals",    emoji: "👤",  maxScore: 10 },
  "geo-readiness":       { name: "AI Search Readiness (GEO)",  emoji: "🤖",  maxScore: 15 },
};

const CATEGORY_ORDER = [
  "title-meta", "headings", "content-depth", "search-performance",
  "internal-links", "faq-questions", "entity-signals", "geo-readiness",
];

export async function gradePageSeo(url: string, snapshot: GscSnapshot | null): Promise<GradeResult> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { "X-Return-Format": "markdown" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error("Failed to fetch the page. Check the URL and try again.");
  const content = await res.text();
  if (!content || content.trim().length < 100)
    throw new Error("The page didn't return enough content to analyze.");

  const normalized = url.replace(/\/$/, "");
  const pageData = (snapshot?.pages ?? []).find(
    (p) => p.url.replace(/\/$/, "") === normalized
  );
  const pageQueries = (snapshot?.queries ?? [])
    .filter((q) => q.page && q.page.replace(/\/$/, "") === normalized)
    .slice(0, 10);

  const gscBlock = pageData
    ? `GSC last 28 days: ${pageData.clicks} clicks, ${pageData.impressions} impressions, ${(pageData.ctr * 100).toFixed(1)}% CTR, avg position ${pageData.position.toFixed(1)}.`
    : "No GSC data available for this page yet.";
  const queriesBlock = pageQueries.length
    ? `Top queries: ${pageQueries.map((q) => `"${q.query}" (pos ${q.position.toFixed(0)}, ${q.impressions} imp)`).join(", ")}`
    : "";

  const messages: AiMessage[] = [
    {
      role: "system",
      content:
        "You are an SEO and GEO (Generative Engine Optimization) expert. Grade pages honestly — most score 35-65 out of 100. Return only valid JSON matching the exact schema requested. No markdown, no explanation.",
    },
    {
      role: "user",
      content: `Grade this page for SEO and GEO readiness.

URL: ${url}
${gscBlock}
${queriesBlock}

Page content:
${content.slice(0, 6000)}

Return JSON with this exact shape:
{
  "categories": [
    { "id": "title-meta",         "score": <0-15>, "status": <"great"|"good"|"needs-work"|"missing">, "finding": "<one plain-English sentence — be specific>", "fix": "<exact action or null if perfect>", "fixType": <"content-refresh"|"rank-tracking"|"internal-links"|"manual"|null> },
    { "id": "headings",           "score": <0-10>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "content-depth",      "score": <0-15>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "search-performance", "score": <0-15>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "internal-links",     "score": <0-10>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "faq-questions",      "score": <0-10>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "entity-signals",     "score": <0-10>, "status": ..., "finding": "...", "fix": "...", "fixType": ... },
    { "id": "geo-readiness",      "score": <0-15>, "status": ..., "finding": "...", "fix": "...", "fixType": ... }
  ]
}

Scoring:
- title-meta (15): 15=keyword-rich title 30-60 chars + compelling meta 50-155 chars, 8=one weak, 3=both thin, 0=missing
- headings (10): 10=clear H1 + 3+ H2s with keywords, 5=H1 only or generic H2s, 0=none
- content-depth (15): 15=comprehensive expert-level, original insights, 8=decent, 3=thin/generic, 0=very thin
- search-performance (15): based on GSC — 15=high CTR at good position, 8=ranking but low CTR, 3=few impressions, 0=no data
- internal-links (10): 10=5+ relevant internal links, 5=2-4 links, 1=one link, 0=none
- faq-questions (10): 10=dedicated FAQ with 4+ Q&As, 5=some questions answered inline, 0=none
- entity-signals (10): 10=author name+date+org+clear topic entity, 5=some present, 0=none
- geo-readiness (15): 15=data/stats cited, answer-first format, quotable snippets, clear claims, 5=some structure, 0=wall of text

fixType: "content-refresh"=needs content edits, "internal-links"=needs link additions, "rank-tracking"=monitor keyword, "manual"=code/technical change, null=already perfect`,
    },
  ];

  const raw = await jsonCompletion<{
    categories: Omit<GradeCategory, "name" | "emoji" | "maxScore">[];
  }>(messages);

  const categories: GradeCategory[] = CATEGORY_ORDER.map((id) => {
    const meta = CATEGORY_META[id];
    const aiData = (raw.categories ?? []).find((c) => c.id === id) ?? {
      id, score: 0, status: "missing" as const, finding: "Not analyzed.", fix: null, fixType: null,
    };
    return { ...meta, ...aiData, score: Math.min(aiData.score ?? 0, meta.maxScore) };
  });

  const totalScore = categories.reduce((s, c) => s + c.score, 0);
  return { url, totalScore, categories };
}
