"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
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
  ClipboardList,
  Check,
  Clock,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import {
  refreshContent,
  getPropertyBaseUrl,
  getSuggestedRefreshPages,
  getContentRefreshCache,
} from "@/app/actions/seo";
import type { ContentRefreshResult } from "@/lib/types";
import { SitemapPagePicker } from "@/components/sitemap-page-picker";

function buildAllChangesPrompt(url: string, result: ContentRefreshResult): string {
  const parts: string[] = [
    `Your task is to implement all of the following SEO improvements to the page at:\n${url}\n\nMake all changes directly to the page file. Preserve existing content structure and formatting. Do not remove content unless replacing it with something better.`,
    `## Title Tag\nReplace the current title tag with:\n${result.titleTag.suggested}`,
    `## Meta Description\nReplace the current meta description with:\n${result.metaDescription.suggested}`,
  ];

  if (result.missingTopics.length) {
    parts.push(
      `## Missing Topics to Cover\nAdd content that addresses these missing topics:\n${result.missingTopics.map((t) => `- ${t}`).join("\n")}`
    );
  }

  if (result.suggestedH2s.length) {
    parts.push(
      `## New H2 Sections to Add\n${result.suggestedH2s.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
    );
  }

  if (result.faq.length) {
    parts.push(
      `## FAQ Section\nAdd a FAQ section with the following Q&As:\n${result.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`
    );
  }

  if (result.contentAdditions.length) {
    parts.push(
      `## Additional Content Improvements\n${result.contentAdditions.map((a) => `- ${a}`).join("\n")}`
    );
  }

  parts.push(
    `## Instructions\n- Edit the page file directly\n- Improve existing sections before adding new ones\n- Do not add filler or generic introductions\n- Once done, summarize the files changed and what was updated`
  );

  return parts.join("\n\n");
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      <Copy />
    </Button>
  );
}

function CopyAllButton({ url, result }: { url: string; result: ContentRefreshResult }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(buildAllChangesPrompt(url, result));
        setCopied(true);
        toast.success("Full prompt copied — paste into Claude");
        setTimeout(() => setCopied(false), 2500);
      }}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all border ${
        copied
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
          : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600"
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
      {copied ? "Copied!" : "Copy All Changes as Claude Prompt"}
    </button>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Suggested {label}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${suggested.length > limit ? "text-rose-500" : "text-emerald-500 dark:text-emerald-400"}`}
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
  const [cachedAt, setCachedAt] = useState<string | null>(null);
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
          setCachedAt(null);
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
    setCachedAt(null);
    doRefresh(url);
  };

  useEffect(() => {
    if (!prefill || ranPrefill.current) return;
    ranPrefill.current = true;
    // Check DB cache first before running AI
    getContentRefreshCache(prefill).then((cached) => {
      if (cached) {
        setResult(cached.result);
        setCachedAt(cached.generatedAt);
        setLoading(false);
      } else {
        doRefresh(prefill);
      }
    }).catch(() => doRefresh(prefill));
  }, [prefill, doRefresh]);

  return (
    <div>
      <PageHeader
        title="Content Refresh"
        description="AI-drafted improvements for any page: titles, sections, FAQs, and missing topics."
        help="The AI fetches your page, reads it alongside your Search Console queries, then drafts a better title tag, meta description, new H2 sections, and FAQ content you can copy-paste in."
      />

      <div className="max-w-2xl mb-2">
        <SitemapPagePicker onSelect={(u) => { setUrl(u); }} />
      </div>

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
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5"
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
                  onClick={() => { setUrl(page); setLoading(true); setResult(null); setCachedAt(null); doRefresh(page); }}
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
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No page analyzed yet</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Enter a URL above — the AI reads the page and your Search Console data, then
            drafts everything you need to refresh it.
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CopyAllButton url={result.url || url} result={result} />
              <Link
                href={`/page-grader?url=${encodeURIComponent(result.url || url)}`}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <Gauge className="w-4 h-4" />
                Grade this page
              </Link>
            </div>
            {cachedAt && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Loaded from cache · {new Date(cachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                <button
                  onClick={() => { setLoading(true); setResult(null); setCachedAt(null); doRefresh(result.url || url); }}
                  className="ml-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
                >
                  Re-run
                </button>
              </span>
            )}
          </div>

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
                  className="bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 px-3 py-1 text-sm font-medium"
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
                  <span className="flex-none w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{h2}</span>
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
                <div key={i} className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.question}</p>
                    <CopyButton text={`${item.question}\n${item.answer}`} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.answer}</p>
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
                <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
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
