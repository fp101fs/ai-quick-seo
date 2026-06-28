"use server";

import type { ChatMessage } from "@/lib/types";
import { buildCoachSystemPrompt } from "@/lib/prompts/coach";
import { chatCompletion } from "@/lib/services/openrouter";
import { getCachedCrawl, getCurrentOpportunities } from "@/lib/services/context";
import { getUsageStatus } from "@/lib/services/usage";
import { getUserId, getSelectedProperty } from "@/lib/services/session";

const MAX_HISTORY = 12;

export async function askCoach(messages: ChatMessage[]): Promise<string> {
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    throw new Error("A question is required");
  }

  const usage = await getUsageStatus();
  if (usage.blocked) {
    throw new Error("You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access.");
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

  return chatCompletion([systemPrompt, ...history], {
    temperature: 0.5,
    userId: usage.userId ?? undefined,
    feature: "coach",
  });
}

export async function loadChatHistory(): Promise<ChatMessage[]> {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return [];
  const { getChatMessages } = await import("@/lib/db");
  const rows = await getChatMessages(userId, property ?? "");
  return rows as ChatMessage[];
}

export async function persistChatMessage(role: "user" | "assistant", content: string): Promise<void> {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return;
  const { appendChatMessage } = await import("@/lib/db");
  await appendChatMessage(userId, role, content, property ?? "");
}

export async function clearChatHistory(): Promise<void> {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return;
  const { clearChatMessages } = await import("@/lib/db");
  await clearChatMessages(userId, property ?? "");
}
