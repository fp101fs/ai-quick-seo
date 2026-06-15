"use server";

import { getConnectionStatus, getUserId } from "@/lib/services/session";
import { getUsageStatus } from "@/lib/services/usage";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildArticleIdeasPrompt } from "@/lib/prompts/article-ideas";
import { getDemoSnapshot } from "@/lib/demo-data";
import type { ArticleIdeasResult } from "@/lib/types";
import { getCachedSnapshot } from "@/lib/db";
import type { GscSnapshot } from "@/lib/types";

export async function generateArticleIdeas(): Promise<ArticleIdeasResult> {
  const [status, usage] = await Promise.all([
    getConnectionStatus(),
    getUsageStatus(),
  ]);

  if (usage.blocked) {
    throw new Error(
      "You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access."
    );
  }

  let snapshot: GscSnapshot;
  let isDemo = false;

  if (status.demo) {
    snapshot = getDemoSnapshot();
    isDemo = true;
  } else if (status.connected && status.property) {
    const cached = await getCachedSnapshot(status.property);
    if (!cached) {
      throw new Error(
        "No Search Console data found. Visit the Dashboard to import your data first."
      );
    }
    snapshot = cached as GscSnapshot;
  } else {
    throw new Error(
      "Connect Google Search Console first to generate article ideas for your site."
    );
  }

  const userId = await getUserId();
  const result = await jsonCompletion<Omit<ArticleIdeasResult, "generatedAt" | "demo">>(
    buildArticleIdeasPrompt(snapshot),
    { userId: userId ?? undefined, feature: "article-ideas" }
  );

  return {
    ...result,
    ideas: (result.ideas ?? []).slice(0, 15).map((idea, i) => ({
      ...idea,
      rank: i + 1,
      estimatedOpportunity: idea.estimatedOpportunity ?? "medium",
      intent: idea.intent ?? "informational",
    })),
    generatedAt: Date.now(),
    demo: isDemo,
  };
}
