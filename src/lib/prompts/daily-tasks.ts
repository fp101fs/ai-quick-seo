import type { LinkSuggestion, Opportunity } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

function formatQueryData(o: Opportunity): string {
  if (!o.queries?.length) return "";
  const lines = o.queries.map((q) => {
    const parts = [`"${q.query}"`, `pos ${q.position.toFixed(1)}`, `${q.impressions.toLocaleString()} impr`, `${q.clicks} clicks`, `${(q.ctr * 100).toFixed(1)}% CTR`];
    return `    • ${parts.join(" | ")}`;
  });
  return `\n  Actual query data:\n${lines.join("\n")}`;
}

export function buildDailyTasksPrompt(
  opportunities: Opportunity[],
  linkSuggestions: LinkSuggestion[]
): AiMessage[] {
  const opportunityBlock = opportunities
    .slice(0, 15)
    .map(
      (o) =>
        `- [${o.type}] ${o.issue}\n  Page: ${o.page ?? "site-wide"}\n  Suggested fix: ${o.recommendedAction}\n  Estimated impact: ${o.estimatedImpact}${formatQueryData(o)}`
    )
    .join("\n");

  const linkBlock =
    linkSuggestions.length > 0
      ? linkSuggestions
          .slice(0, 8)
          .map((l) => `- Link from ${l.sourceUrl} to ${l.targetUrl} ("${l.anchorText}")`)
          .join("\n")
      : "No internal link analysis has been run yet.";

  return [
    {
      role: "system",
      content:
        "You are an AI SEO employee who turns analysis into a focused daily work plan. You prioritize ruthlessly by expected traffic impact relative to effort, and you explain each task so a non-expert could execute it. When real query data is provided, reference the specific queries and numbers — never tell the user to 'check GSC yourself'.",
    },
    {
      role: "user",
      content: `Based on this site's current SEO situation, generate today's prioritized task list.\n\nSEO opportunities detected:\n${opportunityBlock}\n\nInternal link suggestions:\n${linkBlock}\n\nRespond with ONLY a JSON object in this exact format, no markdown fences or preamble:\n{\n  "tasks": [\n    {\n      "title": "short imperative task title naming the specific page or query",\n      "page": "copy the exact URL from the opportunity's Page field above — never invent a URL",\n      "category": "content" | "links" | "metadata" | "technical",\n      "impact": 1-10,\n      "difficulty": 1-10,\n      "explanation": "2-3 sentences: why this task, what to do, what result to expect. Reference specific queries and numbers from the data above."\n    }\n  ]\n}\n\nGenerate 5-8 tasks sorted by impact (highest first). Merge overlapping opportunities into a single task. Make the first task the single highest-impact action for today.`,
    },
  ];
}
