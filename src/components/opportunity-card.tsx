"use client";

import { useState } from "react";
import {
  TrendingDown,
  Eye,
  Zap,
  MousePointerClick,
  Lightbulb,
  Wrench,
  BarChart3,
  ClipboardCopy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Opportunity, OpportunityType } from "@/lib/types";

const typeConfig: Record<
  OpportunityType,
  { label: string; icon: typeof Zap; chip: string; iconColor: string }
> = {
  "declining-clicks": {
    label: "Losing clicks",
    icon: TrendingDown,
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  "declining-impressions": {
    label: "Losing visibility",
    icon: Eye,
    chip: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  "quick-win": {
    label: "Quick win",
    icon: Zap,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  "low-ctr": {
    label: "Low CTR",
    icon: MousePointerClick,
    chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
};

const impactConfig = {
  high: "bg-indigo-600 text-white",
  medium: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

function buildClaudePrompt(o: Opportunity): string {
  const typeLabels: Record<OpportunityType, string> = {
    "declining-clicks": "declining organic clicks",
    "declining-impressions": "declining search impressions",
    "quick-win": "a quick SEO win opportunity",
    "low-ctr": "a low click-through rate issue",
  };

  const metricsLines: string[] = [];
  if (o.metrics.clicks !== undefined) metricsLines.push(`- Clicks: ${o.metrics.clicks}`);
  if (o.metrics.impressions !== undefined)
    metricsLines.push(`- Impressions: ${o.metrics.impressions}`);
  if (o.metrics.ctr !== undefined)
    metricsLines.push(`- CTR: ${(o.metrics.ctr * 100).toFixed(2)}%`);
  if (o.metrics.position !== undefined)
    metricsLines.push(`- Avg position: ${o.metrics.position.toFixed(1)}`);
  if (o.metrics.clicksDelta !== undefined)
    metricsLines.push(
      `- Clicks change: ${o.metrics.clicksDelta > 0 ? "+" : ""}${o.metrics.clicksDelta}`
    );
  if (o.metrics.impressionsDelta !== undefined)
    metricsLines.push(
      `- Impressions change: ${o.metrics.impressionsDelta > 0 ? "+" : ""}${o.metrics.impressionsDelta}`
    );

  return `I have an SEO issue I need your help fixing. Here's the context:

**Issue type:** ${typeLabels[o.type]} (${o.impact} impact)
${o.page ? `**Page:** ${o.page}` : ""}
${o.query ? `**Query:** ${o.query}` : ""}

**What's happening:** ${o.issue}

**Why it matters:** ${o.whyItMatters}

**Current metrics:**
${metricsLines.join("\n") || "No metrics available"}

**Recommended action:** ${o.recommendedAction}

**Expected impact if fixed:** ${o.estimatedImpact}

Please help me implement the recommended action step by step. Be specific and practical — give me the exact changes to make, the copy to write, or the technical steps to take. Focus only on fixing this specific issue.`;
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const [copied, setCopied] = useState(false);
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildClaudePrompt(opportunity));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-none shadow-sm ring-slate-200 dark:ring-slate-700 hover:ring-indigo-200 dark:hover:ring-indigo-700 transition-all">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("gap-1", config.chip)}>
            <Icon className={cn("w-3 h-3", config.iconColor)} />
            {config.label}
          </Badge>
          <Badge className={cn("border-none capitalize", impactConfig[opportunity.impact])}>
            {opportunity.impact} impact
          </Badge>
        </div>
        <CardTitle className="text-slate-900 dark:text-slate-100 leading-snug mt-1">
          {opportunity.issue}
        </CardTitle>
        {opportunity.page && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">
            {opportunity.page}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{opportunity.whyItMatters}</p>
        </div>
        <div className="flex gap-2.5">
          <Wrench className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
            {opportunity.recommendedAction}
          </p>
        </div>
        <div className="flex gap-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
          <BarChart3 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{opportunity.estimatedImpact}</p>
        </div>

        <button
          onClick={handleCopy}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border",
            copied
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5" />
              Copy Claude Prompt
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
