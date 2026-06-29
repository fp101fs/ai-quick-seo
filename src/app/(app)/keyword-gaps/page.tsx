"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { getKeywordClusters } from "@/app/actions/keyword-gaps";
import { loadArticleIdeas } from "@/app/actions/article-ideas";
import type { KeywordCluster, KeywordClustersResult, ArticleIdea } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

function positionColor(pos: number): string {
  if (pos <= 10) return "#10b981"; // emerald
  if (pos <= 20) return "#f59e0b"; // amber
  return "#f43f5e"; // rose
}

function BubbleChart({
  clusters,
  gapClusterNames,
  onSelect,
  selected,
}: {
  clusters: KeywordCluster[];
  gapClusterNames: Set<string>;
  onSelect: (c: KeywordCluster) => void;
  selected: KeywordCluster | null;
}) {
  const maxImpr = Math.max(...clusters.map((c) => c.totalImpressions), 1);
  const getR = (impr: number) => 30 + 60 * Math.sqrt(impr / maxImpr);

  const COLS = 4;
  const CELL_W = 180;
  const CELL_H = 180;
  const rows = Math.ceil(clusters.length / COLS);
  const W = COLS * CELL_W;
  const H = rows * CELL_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      style={{ maxHeight: 600 }}
    >
      {clusters.map((c, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx = col * CELL_W + CELL_W / 2;
        const cy = row * CELL_H + CELL_H / 2;
        const r = getR(c.totalImpressions);
        const fill = positionColor(c.avgPosition);
        const isGap = gapClusterNames.has(c.name);
        const isSel = selected?.name === c.name;

        return (
          <g
            key={c.name}
            onClick={() => onSelect(c)}
            className="cursor-pointer"
            style={{ opacity: selected && !isSel ? 0.5 : 1, transition: "opacity 0.2s" }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={fill}
              fillOpacity={0.2}
              stroke={isSel ? "#6366f1" : fill}
              strokeWidth={isSel ? 2.5 : 1.5}
            />
            {isGap && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 6}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.7}
              />
            )}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill="currentColor"
              className="fill-slate-800 dark:fill-slate-100"
            >
              {c.name.length > 18 ? c.name.slice(0, 17) + "…" : c.name}
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize={9}
              fill={fill}
            >
              pos {c.avgPosition.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ClusterPanel({
  cluster,
  gapIdeas,
  onClose,
}: {
  cluster: KeywordCluster;
  gapIdeas: ArticleIdea[];
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cluster.name}</h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
          <p className="text-slate-500 dark:text-slate-400">Avg position</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-base mt-0.5">
            #{cluster.avgPosition.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
          <p className="text-slate-500 dark:text-slate-400">Impressions</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-base mt-0.5">
            {cluster.totalImpressions.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Top queries</p>
        <div className="space-y-1">
          {cluster.topQueries.slice(0, 8).map((q) => (
            <div key={q.query} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[60%]">
                {q.query}
              </span>
              <span className="text-slate-400 tabular-nums shrink-0 ml-2">
                #{q.position.toFixed(0)} · {q.impressions.toLocaleString()} impr
              </span>
            </div>
          ))}
        </div>
      </div>

      {gapIdeas.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            ↗ Gap opportunities
          </p>
          {gapIdeas.map((idea) => (
            <div key={idea.targetKeyword} className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                {idea.title}
              </p>
              <Link
                href="/article-ideas"
                className="shrink-0 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Write <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
        Position 1–10
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
        Position 11–20
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
        Position 21+
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-full inline-block border-2 border-dashed border-indigo-500"
          style={{ background: "transparent" }}
        />
        Gap opportunity
      </div>
      <span className="text-slate-400">· Bubble size = impressions</span>
    </div>
  );
}

export default function KeywordGapsPage() {
  const [data, setData] = useState<KeywordClustersResult | null>(null);
  const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KeywordCluster | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clusters, savedIdeas] = await Promise.all([
        getKeywordClusters(),
        loadArticleIdeas().catch(() => null),
      ]);
      setData(clusters);
      setIdeas(savedIdeas?.ideas ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const gapIdeasForCluster = (cluster: KeywordCluster): ArticleIdea[] => {
    const clusterQuerySet = new Set(cluster.queries.map((q) => q.toLowerCase()));
    return ideas.filter((idea) => {
      if (idea.coverage?.status !== "gap") return false;
      const kw = idea.targetKeyword.toLowerCase();
      return (
        clusterQuerySet.has(kw) ||
        Array.from(clusterQuerySet).some((q) => q.includes(kw) || kw.includes(q))
      );
    });
  };

  const gapClusterNames = new Set<string>(
    data?.clusters.filter((c) => gapIdeasForCluster(c).length > 0).map((c) => c.name) ?? []
  );

  return (
    <div>
      <PageHeader
        title="Keyword Gaps"
        description="Your GSC queries grouped into topic clusters. Bubble size = impressions. Color = average position."
        action={
          <Button
            onClick={load}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        }
      />

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button onClick={load} variant="outline" size="sm" className="mt-3">
            Try again
          </Button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <Legend />

          <div className={cn("gap-6", selected ? "grid grid-cols-1 lg:grid-cols-3" : "block")}>
            <div className={cn(selected ? "lg:col-span-2" : "")}>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                <BubbleChart
                  clusters={data.clusters}
                  gapClusterNames={gapClusterNames}
                  onSelect={(c) => setSelected(selected?.name === c.name ? null : c)}
                  selected={selected}
                />
              </div>
            </div>

            {selected && (
              <div className="lg:col-span-1">
                <ClusterPanel
                  cluster={selected}
                  gapIdeas={gapIdeasForCluster(selected)}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>

          {!selected && (
            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              Click any bubble to see queries, position data, and gap article ideas.
            </p>
          )}

          {data.demo && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400">
              Showing demo data — connect Google Search Console to see your real keyword clusters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
