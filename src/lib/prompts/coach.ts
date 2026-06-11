import type { CrawlResult, GscSnapshot, Opportunity } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

export function buildCoachSystemPrompt(
  snapshot: GscSnapshot | null,
  opportunities: Opportunity[],
  crawl: CrawlResult | null
): AiMessage {
  const sections: string[] = [];

  if (snapshot) {
    const s = snapshot.summary;
    sections.push(`SEARCH CONSOLE DATA for ${snapshot.property} (last ${snapshot.rangeDays} days vs prior period):
- Total clicks: ${s.clicks.toLocaleString()} (${s.clicksDelta >= 0 ? "+" : ""}${s.clicksDelta.toLocaleString()})
- Total impressions: ${s.impressions.toLocaleString()} (${s.impressionsDelta >= 0 ? "+" : ""}${s.impressionsDelta.toLocaleString()})
- Average CTR: ${(s.ctr * 100).toFixed(2)}%, average position: ${s.position.toFixed(1)}

Top pages:
${snapshot.pages
  .slice(0, 15)
  .map(
    (p) =>
      `- ${p.url}: ${p.clicks} clicks (${p.clicksDelta >= 0 ? "+" : ""}${p.clicksDelta}), ${p.impressions} impressions, pos ${p.position.toFixed(1)}`
  )
  .join("\n")}

Top queries:
${snapshot.queries
  .slice(0, 15)
  .map((q) => `- "${q.query}": pos ${q.position.toFixed(1)}, ${q.impressions} impressions, ${q.clicks} clicks`)
  .join("\n")}`);
  } else {
    sections.push("No Search Console data is connected yet. Encourage the user to connect on the dashboard.");
  }

  if (opportunities.length > 0) {
    sections.push(`DETECTED OPPORTUNITIES:
${opportunities
  .slice(0, 12)
  .map((o) => `- [${o.impact} impact] ${o.issue} — ${o.recommendedAction}`)
  .join("\n")}`);
  }

  if (crawl) {
    sections.push(`SITE CRAWL (${crawl.pages.length} pages from ${crawl.sitemapUrl}):
- Orphan pages (no internal links): ${crawl.orphanPages.join(", ") || "none"}
- Weakly linked pages: ${crawl.weakPages.join(", ") || "none"}`);
  }

  return {
    role: "system",
    content: `You are an AI SEO Coach — a sharp, friendly SEO expert embedded in the "AI SEO Employee" app. Answer the user's questions using the site data below. Be specific: cite actual pages, queries, and numbers from the data. When recommending work, prioritize by expected traffic impact. Keep answers concise and skimmable (short paragraphs, occasional bullet lists). If asked something the data can't answer, say so and explain what data would help.

${sections.join("\n\n")}`,
  };
}
