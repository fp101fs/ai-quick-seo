"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const ITEMS = [
  { key: "opportunities", label: "View your opportunities", href: "/opportunities" },
  { key: "page-grader", label: "Grade a page", href: "/page-grader" },
  { key: "coach", label: "Ask the AI Coach", href: "/coach" },
  { key: "internal-links", label: "Crawl internal links", href: "/internal-links" },
  { key: "rank-tracking", label: "Track a keyword", href: "/rank-tracking" },
  { key: "content-refresh", label: "Refresh content", href: "/content-refresh" },
];

const KEY_VISITED = "onboarding_visited";
const KEY_DISMISSED = "onboarding_dismissed";
const KEY_COLLAPSED = "onboarding_collapsed";

export function OnboardingChecklist() {
  const pathname = usePathname();
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY_DISMISSED)) return;
    const stored = JSON.parse(localStorage.getItem(KEY_VISITED) ?? "[]") as string[];
    setVisited(new Set(stored));
    setCollapsed(localStorage.getItem(KEY_COLLAPSED) === "1");
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const match = ITEMS.find((i) => pathname.startsWith(i.href));
    if (!match || visited.has(match.key)) return;
    const next = new Set(visited).add(match.key);
    setVisited(next);
    localStorage.setItem(KEY_VISITED, JSON.stringify([...next]));
  }, [pathname, dismissed]);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(KEY_DISMISSED, "1");
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(KEY_COLLAPSED, next ? "1" : "0");
  };

  if (dismissed) return null;

  const done = ITEMS.filter((i) => visited.has(i.key)).length;
  if (done === ITEMS.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={toggleCollapsed}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            Getting started
          </p>
          <p className="text-xs text-slate-400">
            {done} of {ITEMS.length} done
          </p>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1">
            <div
              className="h-1 bg-indigo-500 transition-all duration-500"
              style={{ width: `${(done / ITEMS.length) * 100}%` }}
            />
          </div>
          <ul className="px-4 py-3 space-y-2.5">
            {ITEMS.map((item) => {
              const checked = visited.has(item.key);
              return (
                <li key={item.key} className="flex items-center gap-2.5">
                  {checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <Link
                    href={item.href}
                    className={`text-sm transition-colors truncate ${
                      checked
                        ? "text-slate-400 line-through"
                        : "text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
