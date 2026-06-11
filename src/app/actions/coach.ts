"use server";

import type { ChatMessage } from "@/lib/types";
import { buildCoachSystemPrompt } from "@/lib/prompts/coach";
import { chatCompletion } from "@/lib/services/openrouter";
import { getCachedCrawl, getCurrentOpportunities } from "@/lib/services/context";

const MAX_HISTORY = 12;

export async function askCoach(messages: ChatMessage[]): Promise<string> {
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    throw new Error("A question is required");
  }

  const [{ snapshot, opportunities }, crawl] = await Promise.all([
    getCurrentOpportunities().catch(() => ({ snapshot: null, opportunities: [] })),
    getCachedCrawl().catch(() => null),
  ]);

  const systemPrompt = buildCoachSystemPrompt(snapshot, opportunities, crawl);
  const history = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));

  return chatCompletion([systemPrompt, ...history], { temperature: 0.5 });
}
