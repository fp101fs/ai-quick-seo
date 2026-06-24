"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Gauge,
  Globe,
  Loader2,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { AiLoading } from "@/components/ai-loading";
import { toast } from "sonner";
import { gradePage, getPageGradeCache } from "@/app/actions/page-grader";
import type { GradeResult, GradeCategory, GradeStatus } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function gradeInfo(score: number) {
  if (score >= 90) return { letter: "A", color: "#10b981", textColor: "text-emerald-600 dark:text-emerald-400", label: "Excellent" };
  if (score >= 75) return { letter: "B", color: "#6366f1", textColor: "text-indigo-600 dark:text-indigo-400", label: "Good" };
  if (score >= 60) return { letter: "C", color: "#f59e0b", textColor: "text-amber-600 dark:text-amber-400", label: "Needs Work" };
  if (score >= 40) return { letter: "D", color: "#f97316", textColor: "text-orange-600 dark:text-orange-400", label: "Poor" };
  return { letter: "F", color: "#ef4444", textColor: "text-rose-600 dark:text-rose-400", label: "Critical" };
}

const STATUS_CONFIG: Record<GradeStatus, { icon: typeof CheckCircle2; label: string; chip: string }> = {
  great:       { icon: CheckCircle2,  label: "Great",      chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  good:        { icon: AlertCircle,   label: "Good",       chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "needs-work":{ icon: AlertTriangle, label: "Needs Work", chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  missing:     { icon: XCircle,       label: "Missing",    chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

const FIX_LABELS: Record<string, string> = {
  "content-refresh": "Fix Content",
  "internal-links":  "Add Links",
  "rank-tracking":   "Track Keywords",
  "manual":          "",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const R = 52, CIRC = 2 * Math.PI * R;
  const { letter, color, textColor } = gradeInfo(score);
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10"
          className="stroke-slate-100 dark:stroke-slate-700" />
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${(score / 100) * CIRC} ${CIRC}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold leading-none ${textColor}`}>{score}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">/100</span>
        <span className={`text-xl font-bold leading-none mt-1 ${textColor}`}>{letter}</span>
      </div>
    </div>
  );
}

function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(score / maxScore) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

function FixButton({ category, pageUrl }: { category: GradeCategory; pageUrl: string }) {
  if (!category.fix || !category.fixType || category.fixType === "manual") return null;
  const label = FIX_LABELS[category.fixType];
  if (!label) return null;

  const href =
    category.fixType === "content-refresh" ? `/content-refresh?url=${encodeURIComponent(pageUrl)}`
    : category.fixType === "internal-links" ? "/internal-links"
    : "/rank-tracking";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors shrink-0"
    >
      {label} <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

function CategoryCard({ category, pageUrl }: { category: GradeCategory; pageUrl: string }) {
  const { icon: StatusIcon, label: statusLabel, chip } = STATUS_CONFIG[category.status] ?? STATUS_CONFIG["needs-work"];
  const { color } = gradeInfo(
    category.score === category.maxScore ? 100
    : category.score >= category.maxScore * 0.8 ? 85
    : category.score >= category.maxScore * 0.6 ? 70
    : category.score >= category.maxScore * 0.3 ? 50
    : 20
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">{category.emoji}</span>
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">{category.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {category.score}/{category.maxScore}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${chip}`}>
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
      </div>

      <ScoreBar score={category.score} maxScore={category.maxScore} color={color} />

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {category.finding}
      </p>

      {category.fix && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Fix: </span>
            {category.fix}
          </p>
          <FixButton category={category} pageUrl={pageUrl} />
        </div>
      )}
    </div>
  );
}

function ImprovementPlan({ result }: { result: GradeResult }) {
  const fixes = result.categories
    .filter((c) => c.fix)
    .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score));

  if (!fixes.length) {
    return (
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">🎉 Perfect score — nothing left to fix!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">
          How to get to 100
          <span className="ml-2 text-xs font-normal text-slate-400">ordered by biggest gain</span>
        </h2>
      </div>
      <ul className="divide-y divide-slate-50 dark:divide-slate-700/50">
        {fixes.map((c, i) => (
          <li key={c.id} className="flex items-start gap-4 px-5 py-3.5">
            <span className="flex-none w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm">{c.emoji}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="text-xs text-slate-400">+{c.maxScore - c.score} pts</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.fix}</p>
            </div>
            <FixButton category={c} pageUrl={result.url} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

function PageGraderInner() {
  const prefill = useSearchParams().get("url");
  const [url, setUrl] = useState(prefill ?? "");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(Boolean(prefill));
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const ranPrefill = useRef(false);

  const doGrade = useCallback(
    (target: string) =>
      gradePage(target)
        .then((data) => { setResult(data); setCachedAt(null); toast.success("Page graded!"); })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Grading failed"))
        .finally(() => setLoading(false)),
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) { toast.error("Enter a URL"); return; }
    setLoading(true);
    setResult(null);
    setCachedAt(null);
    doGrade(url);
  };

  useEffect(() => {
    if (!prefill || ranPrefill.current) return;
    ranPrefill.current = true;
    getPageGradeCache(prefill)
      .then((cached) => {
        if (cached) { setResult(cached.result); setCachedAt(cached.generatedAt); setLoading(false); }
        else doGrade(prefill);
      })
      .catch(() => doGrade(prefill));
  }, [prefill, doGrade]);

  const grade = result ? gradeInfo(result.totalScore) : null;

  return (
    <div>
      <PageHeader
        title="Page Grader"
        description="Grade any page out of 100 for SEO and AI search (GEO) readiness."
        help="Enter a page URL and the AI reads it alongside your Search Console data. You get a score for 8 categories — plus a step-by-step plan to reach 100."
      />

      <form onSubmit={handleSubmit} className="space-y-2 max-w-2xl mb-8">
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="https://yoursite.com/page-to-grade"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-12 pr-32 h-13 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
          />
          <Button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-5"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Grading</>
            ) : (
              <><Gauge className="w-4 h-4" /> Grade</>
            )}
          </Button>
        </div>
      </form>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <AiLoading message="Analyzing page across 8 SEO & GEO categories…" size="lg" className="py-20" />
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Gauge className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">No page graded yet</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Enter a URL above — the AI reads it and your Search Console data, then scores it across 8 categories.
          </p>
        </div>
      )}

      {result && grade && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={result.totalScore} />
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className={`text-3xl font-bold ${grade.textColor}`}>{grade.label}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-mono truncate">{result.url}</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-3">
                {result.totalScore >= 100
                  ? "This page scores perfectly across all categories."
                  : `${100 - result.totalScore} points to go. See the improvement plan below.`}
              </p>
              {cachedAt && (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Cached · {new Date(cachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  <button
                    onClick={() => { setLoading(true); setResult(null); setCachedAt(null); doGrade(result.url); }}
                    className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline ml-1"
                  >
                    Re-run
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} pageUrl={result.url} />
            ))}
          </div>

          {/* Improvement plan */}
          <ImprovementPlan result={result} />
        </div>
      )}
    </div>
  );
}

export default function PageGraderPage() {
  return (
    <Suspense>
      <PageGraderInner />
    </Suspense>
  );
}
