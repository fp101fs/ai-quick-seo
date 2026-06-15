import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-quick-seo.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/coach", "/competitor", "/opportunities", "/internal-links", "/content-refresh", "/usage"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
