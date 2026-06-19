"use client";

import { useEffect, useState } from "react";
import { Hash } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getGscQueries, type GscQueryRow } from "@/app/actions/seo";

export default function KeywordsPage() {
  const [rows, setRows] = useState<GscQueryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGscQueries().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Keywords"
        description="Top queries driving traffic to your site from Google Search Console (28-day average)."
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Hash className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No GSC data yet. Connect your property from the dashboard.</p>
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
                <th className="px-5 py-3 text-right">Avg Position</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.query}
                  className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${
                    i % 2 === 0 ? "" : "bg-slate-50/50 dark:bg-slate-700/20"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{r.query}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{r.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{r.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                    {(r.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${r.position <= 3 ? "text-emerald-600" : r.position <= 10 ? "text-amber-600" : "text-slate-500"}`}>
                      {r.position.toFixed(1)}
                    </span>
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
