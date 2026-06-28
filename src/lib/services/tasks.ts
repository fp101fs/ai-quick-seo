// Daily task generation: AI prioritization over detected opportunities,
// with a deterministic fallback so the dashboard always renders.

import type { LinkSuggestion, Opportunity, SeoTask } from "@/lib/types";
import { cached } from "@/lib/services/store";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildDailyTasksPrompt } from "@/lib/prompts/daily-tasks";

const typeToCategory: Record<Opportunity["type"], SeoTask["category"]> = {
  "declining-clicks": "content",
  "declining-impressions": "content",
  "quick-win": "links",
  "low-ctr": "metadata",
};

function buildCopyPrompt(task: SeoTask, opportunities: Opportunity[]): string {
  const opp = opportunities.find((o) => o.page && o.page === task.page);
  if (!opp) {
    return [
      "You are an SEO expert. Help me fix this issue on my website.",
      "",
      `Task: ${task.title}`,
      task.page ? `Page: ${task.page}` : "",
      "",
      task.explanation,
    ].filter(Boolean).join("\n");
  }

  const queryLines = opp.queries?.length
    ? opp.queries
        .map((q) => `• "${q.query}" — position ${q.position.toFixed(1)}, ${q.impressions.toLocaleString()} impressions, ${q.clicks} clicks, ${(q.ctr * 100).toFixed(1)}% CTR`)
        .join("\n")
    : "";
  const querySection = queryLines ? `\n\nTop queries for this page:\n${queryLines}` : "";

  switch (opp.type) {
    case "declining-clicks":
      return `I need SEO help with this page: ${task.page}\n\n${opp.issue}.${querySection}\n\nPlease: (1) identify what content may be outdated or no longer matching search intent for these queries, (2) suggest specific sections to update or add, (3) check if the title tag still matches what searchers expect.`;

    case "declining-impressions":
      return `I need SEO help with this page: ${task.page}\n\n${opp.issue}.${querySection}\n\nPlease: (1) suggest new H2 sections targeting each of the queries above, (2) identify content angles that could re-establish topical relevance, (3) recommend anchor text for internal links pointing to this page using these phrases.`;

    case "quick-win": {
      const estimatedGain = opp.metrics.impressions ? Math.round(opp.metrics.impressions * 0.08) : null;
      const posLabel = (opp.metrics.position ?? 20) <= 10 ? "page 1 but below the fold" : "page 2";
      return [
        `I need SEO help ranking higher for a specific query.`,
        ``,
        `Page: ${task.page ?? "unknown"}`,
        `Query: "${opp.query}"`,
        `Current position: ${opp.metrics.position?.toFixed(1)} (${posLabel})`,
        `Impressions (last 28 days): ${opp.metrics.impressions?.toLocaleString()}`,
        `Current CTR: ${opp.metrics.ctr ? (opp.metrics.ctr * 100).toFixed(1) + "%" : "—"}`,
        estimatedGain ? `Estimated gain at position ~3: ~${estimatedGain} extra clicks per 28 days` : "",
        ``,
        `Please: (1) optimize the H1 and title tag to include this exact phrase, (2) suggest a dedicated section directly answering this query, (3) recommend anchor text for 2–3 internal links pointing to this page.`,
      ].filter((l) => l !== null).join("\n");
    }

    case "low-ctr":
      return `I need help improving the click-through rate for this page: ${task.page}\n\n${opp.issue}.${querySection}\n\nPeople see this page in search results but don't click. Please: (1) rewrite the title tag to lead with the key benefit and include a number or the current year, (2) rewrite the meta description to be compelling and match the dominant search intent, (3) identify which query above has the worst CTR and prioritize the snippet rewrite for it.`;
  }
}

function fallbackTasks(
  opportunities: Opportunity[],
  linkSuggestions: LinkSuggestion[]
): SeoTask[] {
  const impactScore = { high: 9, medium: 6, low: 3 } as const;
  const tasks: SeoTask[] = opportunities.slice(0, 6).map((o, i) => {
    const task: SeoTask = {
      id: `task-${i}`,
      title: o.issue,
      page: o.page,
      category: typeToCategory[o.type],
      impact: impactScore[o.impact],
      difficulty: o.type === "low-ctr" ? 2 : o.type === "quick-win" ? 4 : 6,
      explanation: `${o.recommendedAction} ${o.estimatedImpact}`,
    };
    task.prompt = buildCopyPrompt(task, opportunities);
    return task;
  });

  if (linkSuggestions.length > 0) {
    tasks.push({
      id: `task-links`,
      title: `Add ${linkSuggestions.length} suggested internal links`,
      category: "links",
      impact: 7,
      difficulty: 2,
      explanation:
        "Internal links pass authority to under-linked pages and help Google understand site structure. Start with the orphan pages — they're invisible to crawlers following links.",
    });
  }

  return tasks.sort((a, b) => b.impact - a.impact);
}

/**
 * Generates today's prioritized task list. Cached per property per day so
 * the plan stays stable as the user works through it.
 */
export async function generateDailyTasks(
  cacheKey: string,
  opportunities: Opportunity[],
  linkSuggestions: LinkSuggestion[],
  userId?: number
): Promise<SeoTask[]> {
  if (opportunities.length === 0 && linkSuggestions.length === 0) return [];

  const day = new Date().toISOString().slice(0, 10);
  return cached(`tasks:${cacheKey}:${day}:v2`, 12 * 60 * 60 * 1000, async () => {
    try {
      const result = await jsonCompletion<{ tasks: SeoTask[] }>(
        buildDailyTasksPrompt(opportunities, linkSuggestions),
        { userId, feature: "tasks" }
      );
      const tasks = (result.tasks ?? [])
        .filter((t) => t.title && t.explanation)
        .map((t, i) => {
          const task: SeoTask = {
            ...t,
            id: `task-${i}`,
            impact: Math.min(10, Math.max(1, Math.round(t.impact) || 5)),
            difficulty: Math.min(10, Math.max(1, Math.round(t.difficulty) || 5)),
            category: (["content", "links", "metadata", "technical"] as const).includes(t.category)
              ? t.category
              : "content",
          };
          task.prompt = buildCopyPrompt(task, opportunities);
          return task;
        })
        .sort((a, b) => b.impact - a.impact);
      if (tasks.length === 0) throw new Error("AI returned no tasks");
      return tasks;
    } catch (error) {
      console.error("AI task generation failed, using fallback:", error);
      return fallbackTasks(opportunities, linkSuggestions);
    }
  });
}
