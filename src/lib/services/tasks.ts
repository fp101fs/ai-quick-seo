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

function fallbackTasks(
  opportunities: Opportunity[],
  linkSuggestions: LinkSuggestion[]
): SeoTask[] {
  const impactScore = { high: 9, medium: 6, low: 3 } as const;
  const tasks: SeoTask[] = opportunities.slice(0, 6).map((o, i) => ({
    id: `task-${i}`,
    title: o.issue,
    page: o.page,
    category: typeToCategory[o.type],
    impact: impactScore[o.impact],
    difficulty: o.type === "low-ctr" ? 2 : o.type === "quick-win" ? 4 : 6,
    explanation: `${o.recommendedAction} ${o.estimatedImpact}`,
  }));

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
  return cached(`tasks:${cacheKey}:${day}`, 12 * 60 * 60 * 1000, async () => {
    try {
      const result = await jsonCompletion<{ tasks: SeoTask[] }>(
        buildDailyTasksPrompt(opportunities, linkSuggestions),
        { userId, feature: "tasks" }
      );
      const tasks = (result.tasks ?? [])
        .filter((t) => t.title && t.explanation)
        .map((t, i) => ({
          ...t,
          id: `task-${i}`,
          impact: Math.min(10, Math.max(1, Math.round(t.impact) || 5)),
          difficulty: Math.min(10, Math.max(1, Math.round(t.difficulty) || 5)),
          category: (["content", "links", "metadata", "technical"] as const).includes(
            t.category
          )
            ? t.category
            : "content",
          prompt: typeof t.prompt === "string" && t.prompt ? t.prompt : undefined,
        }))
        .sort((a, b) => b.impact - a.impact);
      if (tasks.length === 0) throw new Error("AI returned no tasks");
      return tasks;
    } catch (error) {
      console.error("AI task generation failed, using fallback:", error);
      return fallbackTasks(opportunities, linkSuggestions);
    }
  });
}
