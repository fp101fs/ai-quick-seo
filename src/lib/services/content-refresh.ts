// Content refresh analysis: fetch page content (Jina Reader, same pattern
// as the competitor analyzer) plus the page's Search Console queries, then
// ask the AI for a structured refresh plan.

import type { ContentRefreshResult, GscSnapshot } from "@/lib/types";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildContentRefreshPrompt } from "@/lib/prompts/content-refresh";

async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { "X-Return-Format": "markdown" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch the page. Check the URL and try again.");
  }
  const markdown = await response.text();
  if (!markdown || markdown.trim().length < 100) {
    throw new Error("The page didn't return enough content to analyze.");
  }
  return markdown;
}

export async function analyzeContentRefresh(
  url: string,
  snapshot: GscSnapshot | null,
  userId?: number
): Promise<ContentRefreshResult> {
  const content = await fetchPageContent(url);

  const normalizedTarget = url.replace(/\/$/, "");
  const pageQueries = (snapshot?.queries ?? [])
    .filter((q) => q.page && q.page.replace(/\/$/, "") === normalizedTarget)
    .slice(0, 12);

  const result = await jsonCompletion<Omit<ContentRefreshResult, "url">>(
    buildContentRefreshPrompt(url, content, pageQueries),
    { userId, feature: "content-refresh" }
  );

  return {
    url,
    missingTopics: result.missingTopics ?? [],
    suggestedH2s: result.suggestedH2s ?? [],
    faq: result.faq ?? [],
    titleTag: result.titleTag ?? { current: "", suggested: "" },
    metaDescription: result.metaDescription ?? { current: "", suggested: "" },
    contentAdditions: result.contentAdditions ?? [],
  };
}
