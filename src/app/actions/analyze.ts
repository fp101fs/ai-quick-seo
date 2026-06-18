"use server";

import { getUsageStatus } from "@/lib/services/usage";
import { getConnectionStatus, getUserId } from "@/lib/services/session";
import { jsonCompletion } from "@/lib/services/openrouter";

export async function suggestCompetitors(): Promise<string[]> {
  try {
    const [status, userId] = await Promise.all([getConnectionStatus(), getUserId()]);
    const { getCachedSnapshot } = await import("@/lib/db");

    let topQueries: string[] = [];

    if (status.demo || status.property) {
      const property = status.demo ? "demo" : status.property!;
      const snap = await getCachedSnapshot(property).catch(() => null);
      if (snap) {
        topQueries = (snap as { pages?: Array<{ queries?: Array<{ query: string; clicks: number }> }> })
          .pages?.flatMap((p) => p.queries ?? [])
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5)
          .map((q) => q.query) ?? [];
      }
    }

    if (!topQueries.length) return [];

    const searchQuery = topQueries.join(" ");

    // ponytail: html.duckduckgo.com/html is server-rendered; duckduckgo.com needs JS
    let markdown = "";
    try {
      const jinaUrl = `https://r.jina.ai/https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
      const jinaRes = await fetch(jinaUrl, { headers: { "X-Return-Format": "markdown" } });
      if (jinaRes.ok) markdown = await jinaRes.text();
    } catch {
      // Jina unavailable — fall through to AI-only
    }

    const prompt = markdown.length > 200
      ? `Extract 5 real competitor website URLs from these search results. Exclude duckduckgo.com. Return full https:// URLs.

Search results:
${markdown.slice(0, 8000)}

Return ONLY: {"competitors": ["https://example.com", ...]}`
      : `Suggest 5 real competitor websites for a site whose top search queries are: ${topQueries.join(", ")}

Return ONLY: {"competitors": ["https://example.com", ...]}`;

    const result = await jsonCompletion<{ competitors: string[] }>(
      [{ role: "user", content: prompt }],
      { userId: userId ?? undefined, feature: "competitor-suggest" }
    );

    return (result.competitors ?? []).slice(0, 5);
  } catch {
    return [];
  }
}

export async function analyzeCompetitor(url: string) {
  if (!url) throw new Error("URL is required");

  const usage = await getUsageStatus();
  if (usage.blocked) {
    throw new Error("You've reached the free AI limit ($0.10/mo). Upgrade to Pro for unlimited access.");
  }

  // Ensure URL has a protocol
  let targetUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    targetUrl = `https://${url}`;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY");
    throw new Error("Configuration error: API key not found");
  }

  try {
    console.log(`Starting analysis for: ${targetUrl}`);

    // 1. Scrape using Jina Reader
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const scrapeResponse = await fetch(jinaUrl, {
      headers: {
        "X-Return-Format": "markdown",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error(`Jina Scrape Error: ${scrapeResponse.status} - ${errorText}`);
      throw new Error(`Failed to scrape site. Please check the URL and try again.`);
    }

    const markdown = await scrapeResponse.text();
    if (!markdown || markdown.trim().length < 100) {
      throw new Error("The site didn't return enough content to analyze.");
    }

    // 2. Analyze using OpenRouter (Claude 3.5 Sonnet)
    const prompt = `
      You are an expert SEO Strategist. Analyze the following markdown content from a competitor's website and provide a detailed SEO report in JSON format.
      
      Website Content:
      ${markdown.substring(0, 15000)}
      
      The JSON response should follow this structure exactly:
      {
        "siteName": "Name of the competitor",
        "summary": "Brief overview of their business model and target audience",
        "keywords": ["list", "of", "top", "5-7", "keywords"],
        "contentGaps": [
          { "topic": "Topic name", "description": "Why they are missing this and how we can capitalize" }
        ],
        "suggestedBlogTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
        "seoStrategy": "Detailed analysis of their current SEO strategy"
      }
      
      Provide ONLY the raw JSON object. Do not include any preamble or markdown formatting like \`\`\`json.
    `;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://serpdo.com",
        "X-Title": "Competitor SEO Analyzer",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error("OpenRouter API Error:", errorData);
      throw new Error(`AI Analysis failed: ${errorData?.error?.message || "Unknown error"}`);
    }

    const data = await aiResponse.json();
    let content = data.choices[0].message.content;
    
    // Robust parsing: strip markdown code blocks if present
    content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    
    try {
      return JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("The AI returned an invalid response format. Please try again.");
    }
  } catch (error) {
    console.error("Analysis Exception:", error);
    throw new Error(
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred during analysis"
    );
  }
}
