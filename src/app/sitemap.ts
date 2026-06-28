import type { MetadataRoute } from "next";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serpdo.com";
const CONTENT_DIR = join(process.cwd(), "content");

function getBlogEntries(): { slug: string; mtime: Date }[] {
  try {
    return readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ slug: f.replace(".md", ""), mtime: statSync(join(CONTENT_DIR, f)).mtime }));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = getBlogEntries().map(({ slug, mtime }) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: mtime,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...blogEntries,
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
