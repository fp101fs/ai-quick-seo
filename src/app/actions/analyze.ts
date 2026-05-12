"use server";

export async function analyzeCompetitor(url: string) {
  if (!url) throw new Error("URL is required");

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
        "HTTP-Referer": "https://github.com/fp101fs/ai-quick-seo",
        "X-Title": "Competitor SEO Analyzer",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        // Removing response_format as it's sometimes flaky with specific providers on OpenRouter
        // unless strictly supported. Claude 3.5 Sonnet supports it, but the prompt 
        // "Provide ONLY the raw JSON" is often more reliable across the OpenRouter relay.
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
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("The AI returned an invalid response format. Please try again.");
    }
  } catch (error: any) {
    console.error("Analysis Exception:", error);
    throw new Error(error.message || "An unexpected error occurred during analysis");
  }
}
