import type { LinkSuggestion, Opportunity } from "@/lib/types";
import type { AiMessage } from "@/lib/services/openrouter";

export function buildDailyTasksPrompt(
  opportunities: Opportunity[],
  linkSuggestions: LinkSuggestion[]
): AiMessage[] {
  const opportunityBlock = opportunities
    .slice(0, 15)
    .map(
      (o) =>
        `- [${o.type}] ${o.issue}\n  Suggested fix: ${o.recommendedAction}\n  Estimated impact: ${o.estimatedImpact}`
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
        "You are an AI SEO employee who turns analysis into a focused daily work plan. You prioritize ruthlessly by expected traffic impact relative to effort, and you explain each task so a non-expert could execute it.",
    },
    {
      role: "user",
      content: `Based on this site's current SEO situation, generate today's prioritized task list.

SEO opportunities detected:
${opportunityBlock}

Internal link suggestions:
${linkBlock}

Respond with ONLY a JSON object in this exact format, no markdown fences or preamble:
{
  "tasks": [
    {
      "title": "short imperative task title naming the specific page or query",
      "page": "https://... (the URL this task concerns, if any)",
      "category": "content" | "links" | "metadata" | "technical",
      "impact": 1-10,
      "difficulty": 1-10,
      "explanation": "2-3 sentences: why this task, what to do, what result to expect"
    }
  ]
}

Generate 5-8 tasks sorted by impact (highest first). Merge overlapping opportunities into a single task. Make the first task the single highest-impact action for today.`,
    },
  ];
}
