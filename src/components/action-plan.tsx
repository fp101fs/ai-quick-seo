"use client";

import { useState } from "react";
import type { SeoTask } from "@/lib/types";

function buildTaskPrompt(task: SeoTask): string {
  return [
    "You are an SEO expert. Help me fix this issue on my website.",
    "",
    `Task: ${task.title}`,
    task.page ? `Page: ${task.page}` : "",
    "",
    task.explanation,
  ].filter(Boolean).join("\n");
}

function buildMegaPrompt(tasks: SeoTask[], site?: string): string {
  const header = [
    "You are an SEO expert. Here are my top " + tasks.length + " priority SEO issues" + (site ? ` for ${site}` : "") + ", ranked by impact. Please help me fix all of them.",
    "",
    "Work through each issue and provide specific, actionable fixes.",
    "",
    "---",
  ].join("\n");

  const items = tasks.map((t, i) => [
    `**Issue ${i + 1}: ${t.title}**`,
    t.page ? `Page: ${t.page}` : null,
    t.explanation,
  ].filter(Boolean).join("\n")).join("\n\n");

  return `${header}\n\n${items}`;
}

export function ActionPlan({ tasks, site }: { tasks: SeoTask[]; site?: string }) {
  const top10 = tasks.slice(0, 10);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyAll = () => {
    navigator.clipboard.writeText(buildMegaPrompt(top10, site));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const copyOne = (task: SeoTask, idx: number) => {
    navigator.clipboard.writeText(buildTaskPrompt(task));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if (!top10.length) return null;

  return (
    <div>
      <button
        onClick={copyAll}
        className="w-full mb-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
      >
        {copiedAll ? "✓ Copied mega prompt!" : `Copy all ${top10.length} tasks as one Claude prompt`}
      </button>
      <ol className="space-y-2">
        {top10.map((task, i) => (
          <li
            key={task.id}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5"
          >
            <span className="text-xs font-bold text-slate-400 w-5 shrink-0 text-right">{i + 1}</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 min-w-0 truncate" title={task.title}>
              {task.title}
            </span>
            <button
              onClick={() => copyOne(task, i)}
              className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-full transition-colors font-medium"
            >
              {copiedIdx === i ? "✓" : "Copy"}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
