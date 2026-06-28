"use client";

import Link from "next/link";
import { FileText, Link2, Tags, Wrench, ArrowRight, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SeoTask } from "@/lib/types";

const categoryConfig: Record<
  SeoTask["category"],
  { label: string; icon: typeof FileText; chip: string }
> = {
  content: {
    label: "Content",
    icon: FileText,
    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  },
  links: {
    label: "Links",
    icon: Link2,
    chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
  },
  metadata: {
    label: "Metadata",
    icon: Tags,
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  technical: {
    label: "Technical",
    icon: Wrench,
    chip: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  },
};

function ScoreDots({ value, color }: { value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i < Math.round(value / 2) ? color : "bg-slate-200 dark:bg-slate-600"
          )}
        />
      ))}
    </span>
  );
}

export function TaskCard({ task }: { task: SeoTask }) {
  const config = categoryConfig[task.category];
  const Icon = config.icon;

  const copyPrompt = () => {
    const text = task.prompt ?? [
      "You are an SEO expert. Help me fix this issue on my website.",
      "",
      `Task: ${task.title}`,
      task.page ? `Page: ${task.page}` : "",
      "",
      task.explanation,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() =>
      toast.success("Prompt copied — paste into Claude")
    );
  };

  return (
    <Card
      size="sm"
      className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700 hover:ring-indigo-200 dark:hover:ring-indigo-700 transition-all"
    >
      <CardContent className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge variant="outline" className={cn("gap-1", config.chip)}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              Impact <ScoreDots value={task.impact} color="bg-indigo-500" />
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              Effort <ScoreDots value={task.difficulty} color="bg-amber-400" />
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {task.title}
          </h3>
          {task.page && (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
              {task.page}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">{task.explanation}</p>
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0 sm:mt-1 items-end">
          {task.page && (
            <Link
              href={`/content-refresh?url=${encodeURIComponent(task.page)}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Open <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <button
            onClick={copyPrompt}
            className="inline-flex items-center gap-1 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-full px-2.5 py-1"
          >
            <Copy className="w-3 h-3" />
            Copy Prompt
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
