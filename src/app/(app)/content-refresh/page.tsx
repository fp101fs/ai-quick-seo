"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Loader2,
  Globe,
  ChevronDown,
  Copy,
  Lightbulb,
  Heading2,
  MessageCircleQuestion,
  Type,
  AlignLeft,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import { refreshContent, getPropertyBaseUrl, getSuggestedRefreshPages } from "@/app/actions/seo";
import type { ContentRefreshResult } from "@/lib/types";

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-slate-400 hover:text-slate-700"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      <Copy />
    </Button>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Lightbulb;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden"
    >
      <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-100 flex-1">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none">
            {count}
          </Badge>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 pt-4">{children}</div>
    </details>
  );
}

function Comparison({
  label,
  current,
  suggested,
  limit,
}: {
  label: string;
  current: string;
  suggested: string;
  limit: number;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Current {label}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{current || <em>None found</em>}</p>
      </div>
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Suggested {label}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${suggested.length > limit ? "text-rose-500" : "text-emerald-500"}`}
            >
              {suggested.length}/{limit}
            </span>
            <CopyButton text={suggested} />
          </div>
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{suggested}</p>
      </div>
    </div>
  );
}

function ContentRefreshInner() {
  const prefill = useSearchParams().get("url");
  const [url, setUrl] = useState(prefill ?? "");
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [suggestedPages, setSuggestedPages] = useState<string[]>([]);
  const [result, setResult] = useState<ContentRefreshResult | null>(null);
  const [loading, setLoading] = useState(Boolean(prefill));
  const ranPrefill = useRef(false);

  useEffect(() => {
    getPropertyBaseUrl().then(setBaseUrl).catch(() => {});
    getSuggestedRefreshPages().then(setSuggestedPages).catch(() => {});
  }, []);

  const doRefresh = useCallback(
    (target: string) =>
      refreshContent(target)
        .then((data) => {
          setResult(data);
          toast.success("Refresh plan ready!");
        })
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Analysis failed")
        )
        .finally(() => setLoading(false)),
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a page URL");
      return;
    }
    setLoading(true);
    setResult(null);
    doRefresh(url);
  };

  useEffect(() => {
    if (!prefill || ranPrefill.current) return;
    ranPrefill.current = true;
    doRefresh(prefill);
  }, [prefill, doRefresh]);

  return (
    <div>
      <PageHeader
        title="Content Refresh"
        description="AI-drafted improvements for any page: titles, sections, FAQs, and missing topics."
        help="The AI fetches your page, reads it alongside your Search Console queries, then drafts a better title tag, meta description, new H2 sections, and FAQ content you can copy-paste in."
      />

      <form onSubmit={handleSubmit} className="space-y-2 max-w-2xl mb-8">
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={baseUrl ? `${baseUrl}/your-page-path` : "https://yoursite.com/page-to-refresh"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-12 pr-36 h-13 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
          />
          <Button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Refresh
              </>
            )}
          </Button>
        </div>
        {baseUrl && url && !url.startsWith("http") && (
          <p className="text-xs text-slate-500 pl-4">
            Will fetch: <span className="font-mono text-indigo-600">
              {url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`}
            </span>
          </p>
        )}
      </form>

      {!result && !loading && suggestedPages.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Suggested pages to refresh
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedPages.map((page) => {
              const label = (() => { try { return new URL(page).pathname; } catch { return page; } })();
              return (
                <button
                  key={page}
                  onClick={() => { setUrl(page); setLoading(true); setResult(null); doRefresh(page); }}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors font-mono"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <AiLoading message="Drafting content improvements…" size="lg" className="py-20" />
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No page analyzed yet</h3>
          <p className="text-slate-500">
            Enter a URL above — the AI reads the page and your Search Console data, then
            drafts everything you need to refresh it.
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section title="Title Tag" icon={Type}>
            <Comparison
              label="title"
              current={result.titleTag.current}
              suggested={result.titleTag.suggested}
              limit={60}
            />
          </Section>

          <Section title="Meta Description" icon={AlignLeft}>
            <Comparison
              label="description"
              current={result.metaDescription.current}
              suggested={result.metaDescription.suggested}
              limit={155}
            />
          </Section>

          <Section title="Missing Topics" icon={Lightbulb} count={result.missingTopics.length}>
            <div className="flex flex-wrap gap-2">
              {result.missingTopics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="bg-amber-50 text-amber-800 border-amber-100 px-3 py-1 text-sm font-medium"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </Section>

          <Section title="Suggested H2 Sections" icon={Heading2} count={result.suggestedH2s.length}>
            <ul className="space-y-2.5">
              {result.suggestedH2s.map((h2, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <span className="flex-none w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800 flex-1">{h2}</span>
                  <CopyButton text={h2} />
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Suggested FAQ Section"
            icon={MessageCircleQuestion}
            count={result.faq.length}
          >
            <div className="space-y-4">
              {result.faq.map((item, i) => (
                <div key={i} className="rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                    <CopyButton text={`${item.question}\n${item.answer}`} />
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Suggested Content Additions"
            icon={PlusCircle}
            count={result.contentAdditions.length}
          >
            <ul className="space-y-3">
              {result.contentAdditions.map((addition, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <PlusCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {addition}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

export default function ContentRefreshPage() {
  return (
    <Suspense>
      <ContentRefreshInner />
    </Suspense>
  );
}
