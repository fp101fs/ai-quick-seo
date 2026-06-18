"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Crown,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { InfoTooltip } from "@/components/info-tooltip";
import { generateArticleIdeas, loadArticleIdeas } from "@/app/actions/article-ideas";
import type { ArticleIdea, ArticleIdeasResult } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

const intentColors: Record<ArticleIdea["intent"], string> = {
  informational: "bg-sky-50 text-sky-700 border-sky-200",
  commercial: "bg-violet-50 text-violet-700 border-violet-200",
  navigational: "bg-slate-100 text-slate-600 border-slate-200",
  transactional: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const opportunityColors: Record<ArticleIdea["estimatedOpportunity"], string> = {
  high: "bg-indigo-600 text-white",
  medium: "bg-indigo-100 text-indigo-700",
  low: "bg-slate-100 text-slate-500",
};

function buildLlmPrompt(ideas: ArticleIdea[]): string {
  const top10 = ideas.slice(0, 10);
  const list = top10.map((idea, i) => `${i + 1}. ${idea.title} (keyword: "${idea.targetKeyword}")`).join("\n");
  return `Please write the following 10 SEO-optimized articles. For each one, write a full article (800-1200 words) with an introduction, 3-5 H2 sections, and a conclusion. Include the target keyword naturally throughout.\n\n${list}`;
}

function IdeaRow({ idea, index }: { idea: ArticleIdea; index: number }) {
  const [copied, setCopied] = useState(false);

  const copyTitle = () => {
    navigator.clipboard.writeText(idea.title);
    setCopied(true);
    toast.success("Title copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
      <div className="flex-none w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{idea.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
            {idea.targetKeyword}
          </span>
          <Badge variant="outline" className={cn("text-xs border capitalize", intentColors[idea.intent])}>
            {idea.intent}
          </Badge>
          <Badge className={cn("text-xs border-none capitalize", opportunityColors[idea.estimatedOpportunity])}>
            {idea.estimatedOpportunity} opp.
          </Badge>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{idea.reasoning}</p>
      </div>
      <button
        onClick={copyTitle}
        className="flex-none opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        title="Copy title"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ArticleIdeasPage() {
  const [result, setResult] = useState<ArticleIdeasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);
  const [blockedByPlan, setBlockedByPlan] = useState(false);

  useEffect(() => {
    loadArticleIdeas()
      .then((saved) => { if (saved) setResult(saved); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const generate = async () => {
    setLoading(true);
    setBlockedByPlan(false);
    try {
      const data = await generateArticleIdeas();
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("free AI limit") || msg.includes("Upgrade")) {
        setBlockedByPlan(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    if (!result) return;
    navigator.clipboard.writeText(buildLlmPrompt(result.ideas));
    setCopied(true);
    toast.success("Prompt copied — paste into any AI to write all 10 articles!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Article Ideas"
        description="AI-generated article titles for keyword gaps in your niche — topics that could rank but don't exist on your site yet."
        action={
          result && (
            <Button
              variant="outline"
              onClick={generate}
              disabled={loading}
              className="border-slate-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </Button>
          )
        }
      />

      {/* Explainer */}
      {!result && !loading && !checking && !blockedByPlan && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex gap-4">
          <div className="flex-none w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-indigo-900">How it works</p>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Analyzes your Search Console queries to identify your niche, maps what you already
              cover, then generates 15 article ideas targeting keyword gaps with real search demand.
              Use the <strong>"Copy top 10 as AI prompt"</strong> button to paste directly into
              ChatGPT, Claude, or any LLM and get all 10 articles written instantly.
            </p>
          </div>
        </div>
      )}

      {/* Plan gate */}
      {blockedByPlan && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-amber-200 dark:ring-amber-800 shadow-sm p-8 text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
            <Crown className="w-7 h-7 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2">Free AI limit reached</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            You&apos;ve used your $0.10/mo free AI credit. Upgrade to Pro for unlimited article
            ideas, content refresh, coach, and competitor spy.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            Upgrade to Pro — $10/mo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Initial DB check skeleton */}
      {checking && !result && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {/* Generate button */}
      {!result && !loading && !checking && !blockedByPlan && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Find your keyword gaps
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Click below to analyze your Search Console data and generate 15 article ideas for
            topics your site is missing.
          </p>
          <Button
            onClick={generate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl"
          >
            <Sparkles className="w-4 h-4" />
            Generate article ideas
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Analyzing your niche and identifying keyword gaps…
              </p>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-7 h-7 rounded-full flex-none" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Niche identified</p>
              </div>
              <p className="text-slate-900 dark:text-slate-100 font-medium">{result.niche}</p>
              {result.existingTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.existingTopics.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-2.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={copyPrompt}
                className={cn(
                  "gap-2 font-semibold rounded-xl transition-all",
                  copied
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy top 10 as AI prompt
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Paste into ChatGPT, Claude, or any LLM
              </p>
            </div>
          </div>

          {/* How to use the copy */}
          {!copied && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Tip:</strong> Click &ldquo;Copy top 10 as AI prompt&rdquo; then paste into any AI (ChatGPT, Claude, Gemini) and hit Enter. It will write all 10 articles in one shot. Publish them and come back to refresh with new ideas.
              </p>
            </div>
          )}

          {/* Idea list */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {result.ideas.length} article ideas
              </h2>
              <InfoTooltip
                text="Ranked by estimated SEO opportunity. High = untapped keyword with strong search demand. Hover any row and click the copy icon to grab a single title."
                side="right"
              />
              {result.demo && (
                <Badge variant="secondary" className="ml-auto bg-amber-50 text-amber-700 border-amber-200">
                  Demo data
                </Badge>
              )}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {result.ideas.map((idea, i) => (
                <IdeaRow key={i} idea={idea} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
