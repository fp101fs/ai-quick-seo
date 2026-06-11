// OpenRouter client. All AI calls in the app go through here so the model,
// headers, and JSON-parsing behavior stay consistent.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "openrouter/free";
}

export async function chatCompletion(
  messages: AiMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Configuration error: OPENROUTER_API_KEY not found");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai-quick-seo.vercel.app",
      "X-Title": "AI SEO Employee",
    },
    body: JSON.stringify({
      model: getModel(),
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
  return content;
}

/**
 * Calls the model and parses the response as JSON, stripping markdown code
 * fences and any preamble the model adds around the JSON payload.
 */
export async function jsonCompletion<T>(messages: AiMessage[]): Promise<T> {
  const raw = await chatCompletion(messages, { temperature: 0.2 });

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
