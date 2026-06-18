"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Loader2,
  Map,
  ArrowRight,
  Unlink,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import { getLastCrawl, runCrawl } from "@/app/actions/seo";
import type { CrawlResult } from "@/lib/types";

const pagePath = (url: string) => {
  try {
    const path = new URL(url).pathname;
    return path === "/" ? url : path;
  } catch {
    return url;
  }
};

function CrawlStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Link2;
  tone: string;
}) {
  return (
    <Card size="sm" className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
      <CardContent className="flex items-center gap-3">
        <span className={`flex w-9 h-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InternalLinksPage() {
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLastCrawl()
      .then((crawl) => {
        if (crawl) {
          setResult(crawl);
          setSitemapUrl(crawl.sitemapUrl);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitemapUrl && !result?.demo) {
      toast.error("Please enter a sitemap URL");
      return;
    }
    setCrawling(true);
    try {
      const crawl = await runCrawl(sitemapUrl);
      setResult(crawl);
      toast.success(`Crawled ${crawl.pages.filter((p) => p.ok).length} pages`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Internal Link Opportunities"
        description="Crawl your sitemap to find orphan pages and get AI-suggested link placements."
        help="Orphan pages have zero internal links — Google may never find them. Weakly linked pages get little authority. This tool maps your link graph and tells you exactly where to add links."
      />

      <form onSubmit={handleCrawl} className="relative max-w-2xl mb-8">
        <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="https://yoursite.com/sitemap.xml"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          className="pl-12 pr-32 h-13 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
        />
        <Button
          type="submit"
          disabled={crawling}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-5"
        >
          {crawling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Crawling
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" /> Crawl
            </>
          )}
        </Button>
      </form>

      {loading || crawling ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <AiLoading
            message={crawling ? "Crawling your sitemap…" : "Loading crawl data…"}
            size="lg"
            className="py-20"
          />
        </div>
      ) : !result ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Link2 className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No crawl yet</h3>
          <p className="text-slate-500">
            Enter your sitemap URL above to map your internal link structure.
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CrawlStat
              label="Pages crawled"
              value={result.pages.filter((p) => p.ok).length}
              icon={FileSearch}
              tone="bg-indigo-50 text-indigo-600"
            />
            <CrawlStat
              label="Orphan pages"
              value={result.orphanPages.length}
              icon={Unlink}
              tone="bg-rose-50 text-rose-600"
            />
            <CrawlStat
              label="Weakly linked"
              value={result.weakPages.length}
              icon={AlertTriangle}
              tone="bg-amber-50 text-amber-600"
            />
            <CrawlStat
              label="Suggestions"
              value={result.suggestions.length}
              icon={Link2}
              tone="bg-emerald-50 text-emerald-600"
            />
          </div>

          {result.suggestions.length > 0 && (
            <section>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Suggested link placements</h2>
              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <Card key={i} size="sm" className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded px-2 py-1">
                          {pagePath(s.sourceUrl)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded px-2 py-1">
                          {pagePath(s.targetUrl)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                        Anchor text:{" "}
                        <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 font-medium">
                          {s.anchorText}
                        </Badge>
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{s.reasoning}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.orphanPages.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Unlink className="w-4 h-4 text-rose-500" />
                    Orphan pages
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    No internal links point here — search engines may never find these pages.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.orphanPages.map((url) => (
                      <li key={url} className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
                        {pagePath(url)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.weakPages.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Weakly linked pages
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Only one internal link — these pages get little authority.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.weakPages.map((url) => (
                      <li key={url} className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
                        {pagePath(url)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <section>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">All crawled pages</h2>
            <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700 py-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[...result.pages]
                  .sort((a, b) => a.inboundLinks - b.inboundLinks)
                  .map((page) => (
                    <div key={page.url} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {page.title || pagePath(page.url)}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {pagePath(page.url)}
                        </p>
                      </div>
                      {!page.ok ? (
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none shrink-0">
                          fetch failed
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`border-none shrink-0 ${
                            page.inboundLinks === 0
                              ? "bg-rose-50 text-rose-600"
                              : page.inboundLinks === 1
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {page.inboundLinks} inbound
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
