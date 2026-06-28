"use server";

import { getConnectionStatus, getUserId } from "@/lib/services/session";
import { getUsageStatus } from "@/lib/services/usage";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildArticleIdeasPrompt } from "@/lib/prompts/article-ideas";
import { getDemoSnapshot } from "@/lib/demo-data";
import type { ArticleIdeasResult } from "@/lib/types";
import { getCachedSnapshot, saveArticleIdeas, getLatestArticleIdeas } from "@/lib/db";
import type { GscSnapshot } from "@/lib/types";
import { fetchSiteMetadata } from "@/lib/services/site-metadata";

export async function loadArticleIdeas(): Promise<ArticleIdeasResult | null> {
  const [userId, status] = await Promise.all([getUserId(), getConnectionStatus()]);
  if (!userId || (!status.demo && !status.property)) return null;
  const property = status.demo ? "demo" : status.property!;
  const saved = await getLatestArticleIdeas(userId, property);
  return saved ? (saved as ArticleIdeasResult) : null;
}

export async function generateArticleIdeas(opts?: { nicheOverride?: string }): Promise<ArticleIdeasResult> {
  const [status, usage] = await Promise.all([
    getConnectionStatus(),
    getUsageStatus(),
  ]);

  if (usage.blocked) {
    throw new Error(
      "You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access."
    );
  }

  const userId = await getUserId();
  let snapshot: GscSnapshot;
  let isDemo = false;
  let domain: string | undefined;

  if (status.demo) {
    snapshot = getDemoSnapshot();
    isDemo = true;
  } else if (status.connected && status.property) {
    const cached = await getCachedSnapshot(status.property, userId ?? undefined);
    if (!cached) {
      throw new Error(
        "No Search Console data found. Visit the Dashboard to import your data first."
      );
    }
    snapshot = cached as GscSnapshot;
    domain = status.property.startsWith("sc-domain:")
      ? `https://${status.property.replace("sc-domain:", "")}`
      : status.property.replace(/\/$/, "");
  } else {
    throw new Error(
      "Connect Google Search Console first to generate article ideas for your site."
    );
  }

  const metadata = domain ? await fetchSiteMetadata(domain).catch(() => null) : null;

  const result = await jsonCompletion<Omit<ArticleIdeasResult, "generatedAt" | "demo">>(
    buildArticleIdeasPrompt(snapshot, { domain, metadata, nicheOverride: opts?.nicheOverride }),
    { userId: userId ?? undefined, feature: "article-ideas" }
  );

  const final: ArticleIdeasResult = {
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

  const property = isDemo ? "demo" : status.property!;
  if (userId) await saveArticleIdeas(userId, property, final).catch(() => {});

  return final;
}
