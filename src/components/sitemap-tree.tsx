"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { PagePerformance } from "@/lib/types";

function pathLabel(url: string) {
  try { return new URL(url).pathname || "/"; } catch { return url; }
}

function groupBySegment(pages: PagePerformance[]): Map<string, PagePerformance[]> {
  const groups = new Map<string, PagePerformance[]>();
  for (const page of pages) {
    let key = "/";
    try {
      const parts = new URL(page.url).pathname.split("/").filter(Boolean);
      if (parts.length > 0) key = `/${parts[0]}/`;
    } catch {}
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(page);
  }
  return groups;
}

export function SitemapTree({ pages }: { pages: PagePerformance[] }) {
  const groups = groupBySegment(pages);
  // all groups start expanded; Set tracks collapsed ones
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (!pages.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-12">
        No pages found. Connect Search Console to see your site&apos;s pages.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from(groups.entries()).map(([group, groupPages]) => {
        const isCollapsed = collapsed.has(group);
        return (
          <div
            key={group}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <button
              onClick={() => toggle(group)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 font-mono">
                {group}
              </span>
              <span className="text-xs text-slate-400 ml-1">({groupPages.length})</span>
            </button>

            {!isCollapsed && (
              <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {groupPages.map((page) => (
                  <div
                    key={page.url}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <span
                      className="flex-1 text-sm text-slate-600 dark:text-slate-400 font-mono truncate"
                      title={page.url}
                    >
                      {pathLabel(page.url)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/page-grader?url=${encodeURIComponent(page.url)}`}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors font-medium"
                      >
                        Grade
                      </Link>
                      <Link
                        href={`/content-refresh?url=${encodeURIComponent(page.url)}`}
                        className="text-xs px-2.5 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors font-medium"
                      >
                        Improve
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
