"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  addKeyword,
  getKeywordChartData,
  getTrackingData,
  refreshPositions,
  removeKeyword,
} from "@/app/actions/rank-tracking";

interface Row {
  keyword: string;
  today: number | null;
  yesterday: number | null;
}

interface ChartPoint {
  date: string;
  position: number | null;
}

function PositionChart({ data }: { data: ChartPoint[] }) {
  const valid = data.filter((d) => d.position != null) as { date: string; position: number }[];
  if (valid.length < 2) return <p className="text-xs text-slate-400 py-2">Not enough data yet.</p>;

  const W = 560, H = 120, PAD = { t: 8, r: 8, b: 24, l: 32 };
  const maxPos = Math.max(...valid.map((d) => d.position), 1);
  const minPos = Math.max(1, Math.min(...valid.map((d) => d.position)) - 2);
  const rangePos = maxPos - minPos || 1;

  const xs = valid.map((_, i) => PAD.l + (i / (valid.length - 1)) * (W - PAD.l - PAD.r));
  // Y: lower position number = higher on chart (inverted)
  const ys = valid.map((d) =>
    PAD.t + ((d.position - minPos) / rangePos) * (H - PAD.t - PAD.b)
  );

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  // Y-axis ticks
  const ticks = [minPos, Math.round((minPos + maxPos) / 2), maxPos];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* grid lines */}
      {ticks.map((t) => {
        const y = PAD.t + ((t - minPos) / rangePos) * (H - PAD.t - PAD.b);
        return (
          <g key={t}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{t.toFixed(0)}</text>
          </g>
        );
      })}
      {/* line */}
      <path d={path} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" />
      {/* dots */}
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={3} fill="#6366f1" />
      ))}
      {/* x labels: first and last date */}
      <text x={xs[0]} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">{valid[0].date.slice(5)}</text>
      <text x={xs[xs.length - 1]} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">{valid[valid.length - 1].date.slice(5)}</text>
    </svg>
  );
}

function MiniSparkline({ data }: { data: ChartPoint[] }) {
  const valid = data.filter((d) => d.position != null) as { date: string; position: number }[];
  if (valid.length < 2) return <span className="text-slate-300 text-xs">—</span>;
  const W = 80, H = 24;
  const maxPos = Math.max(...valid.map((d) => d.position));
  const minPos = Math.min(...valid.map((d) => d.position));
  const range = maxPos - minPos || 1;
  const xs = valid.map((_, i) => (i / (valid.length - 1)) * W);
  const ys = valid.map((d) => ((d.position - minPos) / range) * H); // higher pos = lower rank = higher y
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const improving = valid[valid.length - 1].position < valid[0].position;
  const color = improving ? "#10b981" : "#ef4444";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="inline-block">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function Change({ today, yesterday }: { today: number | null; yesterday: number | null }) {
  if (today == null) return <span className="text-slate-400 text-xs">—</span>;
  if (yesterday == null) return <span className="text-slate-400 text-xs">new</span>;
  const diff = yesterday - today; // positive = moved up (lower number)
  if (diff === 0) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`text-xs font-semibold ${diff > 0 ? "text-emerald-600" : "text-rose-500"}`}>
      {diff > 0 ? `▲${diff.toFixed(1)}` : `▼${Math.abs(diff).toFixed(1)}`}
    </span>
  );
}

export default function RankTrackingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Record<string, ChartPoint[]>>({});

  async function load() {
    const data = await getTrackingData();
    setRows(data);
    // pre-load sparkline data for all keywords in parallel
    const entries = await Promise.all(data.map(async (r) => [r.keyword, await getKeywordChartData(r.keyword)] as const));
    setChartData(Object.fromEntries(entries));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    try {
      await addKeyword(input.trim());
      setInput("");
      await load();
      toast.success("Keyword added");
    } catch { toast.error("Failed to add keyword"); }
    finally { setAdding(false); }
  }

  async function handleRemove(kw: string) {
    await removeKeyword(kw);
    if (expanded === kw) setExpanded(null);
    await load();
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshPositions();
      await load();
      toast.success("Positions refreshed");
    } catch { toast.error("Refresh failed"); }
    finally { setRefreshing(false); }
  }

  async function handleExpand(kw: string) {
    if (expanded === kw) { setExpanded(null); return; }
    setExpanded(kw);
    if (!chartData[kw]) {
      const data = await getKeywordChartData(kw);
      setChartData((prev) => ({ ...prev, [kw]: data }));
    }
  }

  return (
    <div>
      <PageHeader
        title="Rank Tracking"
        description="Track keyword positions from Google Search Console over time."
      />

      <div className="flex items-center gap-3 mb-6">
        <form onSubmit={handleAdd} className="flex gap-2 flex-1 max-w-md">
          <Input
            placeholder="Add keyword to track…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-10"
          />
          <Button type="submit" disabled={adding} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
            <Plus className="w-4 h-4" /> Track
          </Button>
        </form>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="shrink-0">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Add keywords above to start tracking positions.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Keyword</th>
                <th className="px-5 py-3 text-right">Position</th>
                <th className="px-5 py-3 text-right">vs Yesterday</th>
                <th className="px-5 py-3 text-right">Trend</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <>
                  <tr
                    key={r.keyword}
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => handleExpand(r.keyword)}
                  >
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <Link
                        href="/keywords"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                      >{r.keyword}</Link>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.today != null ? (
                        <span className={`font-semibold ${r.today <= 3 ? "text-emerald-600" : r.today <= 10 ? "text-amber-600" : "text-slate-500"}`}>
                          {r.today.toFixed(1)}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Change today={r.today} yesterday={r.yesterday} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <MiniSparkline data={chartData[r.keyword] ?? []} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(r.keyword); }}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                  {expanded === r.keyword && (
                    <tr key={`${r.keyword}-chart`} className="bg-slate-50 dark:bg-slate-700/20">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Position over time</p>
                          <button onClick={() => setExpanded(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <PositionChart data={chartData[r.keyword] ?? []} />
                        <p className="text-xs text-slate-400 mt-1">Lower = better. #1 is best.</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
