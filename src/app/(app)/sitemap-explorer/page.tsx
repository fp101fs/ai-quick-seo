import { getCurrentSnapshot } from "@/lib/services/context";
import { getPropertyBaseUrl } from "@/app/actions/seo";
import { SitemapTree } from "@/components/sitemap-tree";
import { PageHeader } from "@/components/page-header";
import type { PagePerformance } from "@/lib/types";

const blankPage = (url: string): PagePerformance => ({
  url, clicks: 0, impressions: 0, ctr: 0, position: 0,
  prevClicks: 0, prevImpressions: 0, clicksDelta: 0, impressionsDelta: 0,
});

async function pagesFromSitemap(baseUrl: string): Promise<PagePerformance[]> {
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const locs: string[] = [];
    const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
    let m;
    while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
    return locs.map(blankPage);
  } catch {
    return [];
  }
}

export default async function SitemapExplorerPage() {
  const snapshot = await getCurrentSnapshot().catch(() => null);
  let pages = (snapshot?.pages ?? []).sort((a, b) => b.clicks - a.clicks);
  let fromSitemap = false;

  if (!pages.length) {
    const baseUrl = await getPropertyBaseUrl().catch(() => null);
    if (baseUrl) {
      pages = await pagesFromSitemap(baseUrl);
      fromSitemap = pages.length > 0;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sitemap Explorer"
        description={
          pages.length
            ? fromSitemap
              ? `${pages.length} pages from your sitemap — Search Console data not yet available`
              : `${pages.length} pages from Search Console — click Grade or Improve to take action`
            : "Connect Search Console to browse your pages"
        }
      />
      <SitemapTree pages={pages} />
    </div>
  );
}
