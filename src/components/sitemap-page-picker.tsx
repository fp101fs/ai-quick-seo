"use client";

import { useEffect, useState } from "react";
import { getSitemapPages } from "@/app/actions/seo";

export function SitemapPagePicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    getSitemapPages().then(setPages).catch(() => {});
  }, []);

  if (!pages.length) return null;

  return (
    <select
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) {
          onSelect(e.target.value);
          e.target.value = "";
        }
      }}
      className="w-full max-w-2xl rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 px-5 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="">Or pick a page from your site ({pages.length} pages)…</option>
      {pages.map((url) => {
        const label = (() => { try { return new URL(url).pathname || "/"; } catch { return url; } })();
        return <option key={url} value={url}>{label}</option>;
      })}
    </select>
  );
}
