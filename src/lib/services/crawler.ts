// Sitemap crawler and internal-link analysis. Fetches pages directly and
// parses HTML with regex — no parser dependency, capped for serverless.

import type { CrawledPage, CrawlResult, LinkSuggestion } from "@/lib/types";
import { cached } from "@/lib/services/store";
import { jsonCompletion } from "@/lib/services/openrouter";
import { buildLinkSuggestionPrompt } from "@/lib/prompts/internal-links";

const MAX_PAGES = 30;
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 6;

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "SerpDo/1.0 (+https://serpdo.com)" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function getSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const xml = await fetchText(sitemapUrl);

  // Sitemap index: recurse into child sitemaps until we have enough URLs.
  if (/<sitemapindex/i.test(xml)) {
    const children = extractLocs(xml).slice(0, 5);
    const urls: string[] = [];
    for (const child of children) {
      try {
        urls.push(...extractLocs(await fetchText(child)));
      } catch {
        // Skip unreachable child sitemaps.
      }
      if (urls.length >= MAX_PAGES * 2) break;
    }
    return urls;
  }

  return extractLocs(xml);
}

const stripTags = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    url.hash = "";
    url.search = "";
    let normalized = url.toString();
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function parsePage(url: string, html: string, origin: string): CrawledPage {
  // Ignore nav/footer/header chrome so inbound counts reflect editorial links.
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : "";

  const headings: string[] = [];
  const headingRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(body)) !== null && headings.length < 15) {
    const text = decodeEntities(stripTags(headingMatch[2]));
    if (text) headings.push(text);
  }

  const internalLinks = new Set<string>();
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(body)) !== null) {
    const normalized = normalizeUrl(linkMatch[1], url);
    if (normalized && normalized.startsWith(origin) && normalized !== normalizeUrl(url, url)) {
      internalLinks.add(normalized);
    }
  }

  return { url, ok: true, title, headings, internalLinks: [...internalLinks], inboundLinks: 0 };
}

async function crawlInBatches(urls: string[], origin: string): Promise<CrawledPage[]> {
  const pages: CrawledPage[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url): Promise<CrawledPage> => {
        try {
          return parsePage(url, await fetchText(url), origin);
        } catch {
          return { url, ok: false, title: "", headings: [], internalLinks: [], inboundLinks: 0 };
        }
      })
    );
    pages.push(...results);
  }
  return pages;
}

const tokenize = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3)
  );

function overlapScore(a: Set<string>, b: Set<string>): number {
  let score = 0;
  for (const token of a) if (b.has(token)) score++;
  return score;
}

/** Deterministic fallback when the AI call fails or no key is configured. */
function heuristicSuggestions(
  targets: CrawledPage[],
  sources: CrawledPage[]
): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  for (const target of targets) {
    const targetTokens = tokenize(`${target.title} ${target.headings.join(" ")}`);
    const ranked = sources
      .filter((s) => s.url !== target.url && s.ok)
      .map((s) => ({
        source: s,
        score: overlapScore(targetTokens, tokenize(`${s.title} ${s.headings.join(" ")}`)),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    for (const { source } of ranked) {
      suggestions.push({
        sourceUrl: source.url,
        targetUrl: target.url,
        anchorText: target.title.split(/[|–—-]/)[0].trim().toLowerCase() || target.url,
        reasoning: `"${source.title}" covers closely related topics and currently doesn't link to this under-linked page.`,
      });
    }
  }
  return suggestions;
}

async function generateSuggestions(
  targets: CrawledPage[],
  pages: CrawledPage[],
  userId?: number
): Promise<LinkSuggestion[]> {
  if (targets.length === 0) return [];
  const candidates = heuristicSuggestions(targets, pages);
  if (candidates.length === 0) return [];

  try {
    const ai = await jsonCompletion<{ suggestions: LinkSuggestion[] }>(
      buildLinkSuggestionPrompt(targets, pages, candidates),
      { userId, feature: "internal-links" }
    );
    const valid = (ai.suggestions ?? []).filter(
      (s) => s.sourceUrl && s.targetUrl && s.anchorText && s.reasoning
    );
    return valid.length > 0 ? valid.slice(0, 10) : candidates.slice(0, 10);
  } catch (error) {
    console.error("AI link suggestions failed, using heuristics:", error);
    return candidates.slice(0, 10);
  }
}

/**
 * Crawls a sitemap (capped at 30 pages), builds the internal link graph,
 * and produces link recommendations. Cached for 30 minutes per sitemap.
 */
export async function crawlSitemap(sitemapUrl: string, userId?: number): Promise<CrawlResult> {
  return cached(`crawl:${sitemapUrl}`, 30 * 60 * 1000, async () => {
    const allUrls = await getSitemapUrls(sitemapUrl);
    if (allUrls.length === 0) {
      throw new Error("No URLs found in the sitemap. Check the URL and try again.");
    }

    const origin = new URL(allUrls[0]).origin;
    const urls = allUrls.slice(0, MAX_PAGES);
    const pages = await crawlInBatches(urls, origin);

    const normalizedUrl = (u: string) => normalizeUrl(u, u) ?? u;
    const inbound = new Map<string, number>();
    for (const page of pages) {
      for (const link of page.internalLinks) {
        inbound.set(link, (inbound.get(link) ?? 0) + 1);
      }
    }
    for (const page of pages) {
      page.inboundLinks = inbound.get(normalizedUrl(page.url)) ?? 0;
    }

    const isHome = (p: CrawledPage) => new URL(p.url).pathname === "/";
    const crawledOk = pages.filter((p) => p.ok);
    const orphans = crawledOk.filter((p) => p.inboundLinks === 0 && !isHome(p));
    const weak = crawledOk.filter((p) => p.inboundLinks === 1 && !isHome(p));

    const suggestions = await generateSuggestions(
      [...orphans, ...weak].slice(0, 8),
      crawledOk,
      userId
    );

    return {
      sitemapUrl,
      origin,
      pages,
      orphanPages: orphans.map((p) => p.url),
      weakPages: weak.map((p) => p.url),
      suggestions,
      crawledAt: Date.now(),
      totalUrlsInSitemap: allUrls.length,
    };
  });
}
