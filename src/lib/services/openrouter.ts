// OpenRouter client. All AI calls in the app go through here so the model,
// headers, and JSON-parsing behavior stay consistent.

import { recordAiUsage } from "@/lib/db";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCallOptions {
  temperature?: number;
  userId?: number;
  feature?: string;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "openrouter/free";
}

// Approximate cost per token for common models (USD).
// These are rough estimates; OpenRouter sometimes returns usage.cost directly.
const TOKEN_COSTS: Record<string, { prompt: number; completion: number }> = {
  "openrouter/free": { prompt: 0, completion: 0 },
  "google/gemini-flash-1.5": { prompt: 0.000_000_075, completion: 0.000_000_3 },
  "anthropic/claude-3-haiku": { prompt: 0.000_000_25, completion: 0.000_001_25 },
  "openai/gpt-4o-mini": { prompt: 0.000_000_15, completion: 0.000_000_6 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = TOKEN_COSTS[model] ?? { prompt: 0.000_001, completion: 0.000_002 };
  return promptTokens * costs.prompt + completionTokens * costs.completion;
}

export async function chatCompletion(
  messages: AiMessage[],
  options?: AiCallOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Configuration error: OPENROUTER_API_KEY not found");
  }

  const model = getModel();

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-quick-seo.vercel.app",
      "X-Title": "AI SEO",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("OpenRouter API Error:", errorData);
    throw new Error(
      `AI request failed: ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI returned an empty response. Please try again.");
  }

  // Track usage if a user is signed in
  if (options?.userId) {
    const usage = data?.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    // OpenRouter sometimes returns cost directly
    const costUsd = usage?.cost ?? estimateCost(model, promptTokens, completionTokens);
    recordAiUsage({
      userId: options.userId,
      model,
      promptTokens,
      completionTokens,
      costUsd,
      feature: options.feature ?? "unknown",
    }).catch((err) => console.error("Failed to record AI usage:", err));
  }

  return content;
}

/**
 * Calls the model and parses the response as JSON, stripping markdown code
 * fences and any preamble the model adds around the JSON payload.
 */
export async function jsonCompletion<T>(
  messages: AiMessage[],
  options?: AiCallOptions
): Promise<T> {
  const raw = await chatCompletion(messages, { temperature: 0.2, ...options });

  let content = raw
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  // If the model wrapped the JSON in prose, extract the outermost object/array.
  if (!content.startsWith("{") && !content.startsWith("[")) {
    const objStart = content.indexOf("{");
    const arrStart = content.indexOf("[");
    const start =
      objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
    const end = Math.max(content.lastIndexOf("}"), content.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      content = content.slice(start, end + 1);
    }
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    console.error("Failed to parse AI response as JSON:", raw);
    throw new Error("The AI returned an invalid response format. Please try again.");
  }
}
