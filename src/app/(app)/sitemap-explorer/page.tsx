import { getCurrentSnapshot } from "@/lib/services/context";
import { SitemapTree } from "@/components/sitemap-tree";
import { PageHeader } from "@/components/page-header";

export default async function SitemapExplorerPage() {
  const snapshot = await getCurrentSnapshot().catch(() => null);
  const pages = (snapshot?.pages ?? []).sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sitemap Explorer"
        description={
          pages.length
            ? `${pages.length} pages from Search Console — click Grade or Improve to take action`
            : "Connect Search Console to browse your pages"
        }
      />
      <SitemapTree pages={pages} />
    </div>
  );
}
