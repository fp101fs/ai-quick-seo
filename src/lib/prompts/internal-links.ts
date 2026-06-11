import type { CrawledPage, LinkSuggestion } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

export function buildLinkSuggestionPrompt(
  targets: CrawledPage[],
  pages: CrawledPage[],
  candidates: LinkSuggestion[]
): AiMessage[] {
  const pageSummaries = pages
    .filter((p) => p.ok)
    .map((p) => `- ${p.url}\n  Title: ${p.title}\n  Headings: ${p.headings.slice(0, 6).join("; ")}`)
    .join("\n");

  const targetList = targets
    .map((t) => `- ${t.url} (${t.inboundLinks} inbound internal links)`)
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are an expert SEO consultant specializing in internal linking. You write natural, descriptive anchor text (never 'click here') and explain recommendations in terms of topical relevance and link equity.",
    },
    {
      role: "user",
      content: `Here are the pages of a website:

${pageSummaries}

These pages are orphaned or weakly linked and need more internal links:

${targetList}

Here are candidate source/target pairs found by keyword matching:

${JSON.stringify(candidates, null, 2)}

Refine these into the best internal linking recommendations. For each, choose the most topically relevant source page, write natural anchor text (2-6 words) that would fit in the source page's content, and give a one-sentence reasoning.

Respond with ONLY a JSON object in this exact format, no markdown fences or preamble:
{
  "suggestions": [
    { "sourceUrl": "...", "targetUrl": "...", "anchorText": "...", "reasoning": "..." }
  ]
}

Include at most 10 suggestions, ordered by how much SEO impact each link would have. Only use URLs from the lists above.`,
    },
  ];
}
