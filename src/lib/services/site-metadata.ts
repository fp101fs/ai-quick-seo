"use server";

import { cacheGet, cacheSet } from "@/lib/services/store";

export interface SiteMetadata {
  title: string | null;
  description: string | null;
  h1: string | null;
}

const TTL = 24 * 60 * 60 * 1000;

export async function fetchSiteMetadata(siteUrl: string): Promise<SiteMetadata | null> {
  const key = `meta:${siteUrl}`;
  const hit = cacheGet<SiteMetadata>(key);
  if (hit) return hit;

  try {
    const res = await fetch(siteUrl, {
      headers: { "User-Agent": "SerpDo/1.0 SEO bot" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const title =
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
      null;
    const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;

    const result: SiteMetadata = { title, description, h1 };
    cacheSet(key, result, TTL);
    return result;
  } catch {
    return null;
  }
}
