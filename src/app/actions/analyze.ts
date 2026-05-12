"use server";

export async function analyzeCompetitor(url: string) {
  if (!url) throw new Error("URL is required");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  try {
    // 1. Scrape using Jina Reader
    const jinaUrl = `https://r.jina.ai/${url}`;
    const scrapeResponse = await fetch(jinaUrl, {
      headers: {
        "X-Return-Format": "markdown",
      },
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Failed to scrape site: ${scrapeResponse.statusText}`);
    }

    const markdown = await scrapeResponse.text();

    // 2. Analyze using OpenRouter (Claude 3.5 Sonnet)
    const prompt = `
      You are an expert SEO Strategist. Analyze the following markdown content from a competitor's website and provide a detailed SEO report in JSON format.
      
      Website Content:
      ${markdown.substring(0, 15000)} // Truncate to avoid context limit issues
      
      The JSON response should follow this structure:
      {
        "siteName": "Name of the competitor",
        "summary": "Brief overview of their business model and target audience",
        "keywords": ["list", "of", "top", "5-7", "keywords"],
        "contentGaps": [
          { "topic": "Topic name", "description": "Why they are missing this and how we can capitalize" }
        ],
        "suggestedBlogTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
        "seoStrategy": "Detailed analysis of their current SEO strategy (e.g., technical, backlink focus, content volume)"
      }
      
      Provide ONLY the JSON object.
    `;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/ai-quick-seo",
        "X-Title": "Competitor SEO Analyzer",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      throw new Error(`AI Analysis failed: ${JSON.stringify(errorData)}`);
    }

    const data = await aiResponse.json();
    const content = data.choices[0].message.content;
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "An unexpected error occurred during analysis");
  }
}
