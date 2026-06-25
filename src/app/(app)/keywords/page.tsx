"use client";

import { useEffect, useState } from "react";
import { Hash, Plus, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getGscQueries, getCannibalization, type GscQueryRow, type CannibalRow } from "@/app/actions/seo";
import { addKeyword, getTrackingData } from "@/app/actions/rank-tracking";
import { toast } from "sonner";

// ponytail: industry-average CTR by position 1-4; pos 0 unused
const EXPECTED_CTR = [0, 0.28, 0.15, 0.11, 0.08];

const BANDS = [
  { label: "#1–3",   color: "#10b981", test: (p: number) => p <= 3 },
  { label: "#4–10",  color: "#6366f1", test: (p: number) => p > 3 && p <= 10 },
  { label: "#11–20", color: "#f59e0b", test: (p: number) => p > 10 && p <= 20 },
  { label: "#21–50", color: "#f97316", test: (p: number) => p > 20 && p <= 50 },
  { label: "#51+",   color: "#ef4444", test: (p: number) => p > 50 },
];

function PositionHistogram({ rows }: { rows: GscQueryRow[] }) {
  const bands = BANDS.map((b) => ({ ...b, count: rows.filter((r) => b.test(r.position)).length }));
  const max = Math.max(...bands.map((b) => b.count), 1);
  const W = 560, BAR_H = 26, GAP = 8, PAD = { l: 54, r: 44, t: 6, b: 6 };
  const H = bands.length * (BAR_H + GAP) - GAP + PAD.t + PAD.b;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 p-4 mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Position Distribution — {rows.length} queries</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {bands.map((b, i) => {
          const y = PAD.t + i * (BAR_H + GAP);
          const barW = b.count === 0 ? 2 : Math.max(4, (b.count / max) * (W - PAD.l - PAD.r));
          return (
            <g key={b.label}>
              <text x={PAD.l - 8} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{b.label}</text>
              <rect x={PAD.l} y={y} width={W - PAD.l - PAD.r} height={BAR_H} rx={4} fill="#f1f5f9" />
              <rect x={PAD.l} y={y} width={barW} height={BAR_H} rx={4} fill={b.color} opacity={0.85} />
              <text x={PAD.l + barW + 6} y={y + BAR_H / 2 + 4} fontSize={11} fill="#64748b">{b.count}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function expectedCtr(position: number): number {
  return EXPECTED_CTR[Math.min(Math.round(position), 4)] ?? 0.06;
}

type Tab = "all" | "near-miss" | "low-ctr" | "cannibalization";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All Queries" },
  { id: "near-miss", label: "Near-Miss (#11–20)" },
  { id: "low-ctr", label: "Low CTR" },
  { id: "cannibalization", label: "Cannibalization" },
];

export default function KeywordsPage() {
  const [rows, setRows] = useState<GscQueryRow[]>([]);
  const [cannibal, setCannibal] = useState<CannibalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    Promise.all([
      getGscQueries(),
      getCannibalization(),
      getTrackingData(),
    ]).then(([q, c, t]) => {
      setRows(q);
      setCannibal(c);
      setTracked(new Set(t.map((d) => d.keyword)));
    }).finally(() => setLoading(false));
  }, []);

  async function handleTrack(query: string) {
    setAdding((prev) => new Set(prev).add(query));
    try {
      await addKeyword(query);
      setTracked((prev) => new Set(prev).add(query));
      toast.success(`Tracking "${query}"`);
    } catch {
      toast.error("Failed to add keyword");
    } finally {
      setAdding((prev) => { const s = new Set(prev); s.delete(query); return s; });
    }
  }

  const visibleRows = tab === "all"
    ? rows
    : tab === "near-miss"
    ? rows.filter((r) => r.position >= 11 && r.position <= 20).sort((a, b) => b.impressions - a.impressions)
    : tab === "low-ctr"
    ? rows.filter((r) => r.position < 5 && r.ctr < expectedCtr(r.position)).sort((a, b) => (expectedCtr(a.position) - a.ctr) - (expectedCtr(b.position) - b.ctr)).reverse()
    : [];

  function TrackBtn({ query }: { query: string }) {
    return tracked.has(query) ? (
      <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
    ) : (
      <button
        onClick={() => handleTrack(query)}
        disabled={adding.has(query)}
        title="Track in Rank Tracking"
        className="text-slate-300 hover:text-indigo-500 transition-colors disabled:opacity-40 ml-auto block"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div>
      <PageHeader
        title="Keywords"
        description="Top queries from Google Search Console (28-day average)."
      />

      {!loading && rows.length > 0 && <PositionHistogram rows={rows} />}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : tab === "cannibalization" ? (
        cannibal.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Hash className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No cannibalization detected — no query ranks on 2+ pages.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Query</th>
                  <th className="px-5 py-3">Competing Pages</th>
                  <th className="px-5 py-3 text-right">Total Clicks</th>
                </tr>
              </thead>
              <tbody>
                {cannibal.map((r, i) => (
                  <tr key={r.query} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-700/20"}`}>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100 align-top">{r.query}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        {r.pages.map((p) => (
                          <div key={p.url} className="flex items-center gap-2 text-xs">
                            <span className={`font-semibold w-8 shrink-0 ${p.position <= 3 ? "text-emerald-600" : p.position <= 10 ? "text-amber-600" : "text-slate-500"}`}>
                              #{p.position.toFixed(1)}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs font-mono">
                              {p.url.replace(/^https?:\/\/[^/]+/, "")}
                            </span>
                            <span className="text-slate-400 shrink-0">{p.clicks} clicks</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300 align-top">{r.totalClicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : visibleRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Hash className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">{rows.length === 0 ? "No GSC data yet. Connect your property from the dashboard." : "No keywords match this filter."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Query</th>
                <th className="px-5 py-3 text-right">Clicks</th>
                <th className="px-5 py-3 text-right">Impressions</th>
                <th className="px-5 py-3 text-right">CTR</th>
                {tab === "low-ctr" && <th className="px-5 py-3 text-right">Expected</th>}
                <th className="px-5 py-3 text-right">Avg Position</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => (
                <tr key={r.query} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-700/20"}`}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{r.query}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{r.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{r.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{(r.ctr * 100).toFixed(1)}%</td>
                  {tab === "low-ctr" && (
                    <td className="px-5 py-3 text-right text-rose-500 font-semibold text-xs">
                      {(expectedCtr(r.position) * 100).toFixed(0)}% exp
                    </td>
                  )}
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${r.position <= 3 ? "text-emerald-600" : r.position <= 10 ? "text-amber-600" : "text-slate-500"}`}>
                      {r.position.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <TrackBtn query={r.query} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
