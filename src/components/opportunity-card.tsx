"use client";

import Link from "next/link";
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
  ArrowRight,
  Gauge,
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

function buildCtrPrompt(o: Opportunity): string {
  const metricLines = [
    o.metrics.impressions !== undefined ? `- Impressions: ${o.metrics.impressions}` : "",
    o.metrics.ctr !== undefined ? `- CTR: ${(o.metrics.ctr * 100).toFixed(2)}%` : "",
    o.metrics.position !== undefined ? `- Avg position: ${o.metrics.position.toFixed(1)}` : "",
  ].filter(Boolean).join("\n");

  return `Your task is to increase organic CTR for this page.

## Context

${o.page ? `**Page:** ${o.page}` : ""}

**Issue:** The page receives significant impressions but CTR is far below expected for its average position.

**Current metrics:**
${metricLines}

**Goal:** Improve CTR without changing rankings.

IMPORTANT: Do not make any changes until you have completed the analysis steps.

---

## Step 1: Read the page

Understand:

- Primary search intent
- Target audience
- Core benefit offered
- Unique value proposition
- Existing title tag
- Existing meta description

## Step 2: Analyze search demand

Using available query and SERP data, identify:

- Highest-impression queries driving traffic to this page
- Dominant search intent (informational, commercial, navigational)
- Commercial vs informational intent split
- Keywords appearing in top-ranking titles
- Common title patterns used by competing results

## Step 3: Analyze the SERP

Review competing results ranking near this page.

Identify:

- Common wording patterns
- Common promises
- Common numbers and years
- Common modifiers
- Gaps and differentiation opportunities

Determine why a searcher might click competing results instead of this page.

## Step 4: Create CTR hypotheses

List the top reasons CTR may be underperforming, such as:

- Weak benefit statement
- Generic title
- Missing keyword match
- Weak emotional trigger
- No specificity
- Outdated year
- Poor SERP differentiation

Rank by likely impact.

## Step 5: Generate replacements

Create:

- 10 title tag options
- 5 meta description options

Requirements:

- Match search intent
- Include primary keyword naturally
- Emphasize benefits over features
- Use specificity where appropriate
- Differentiate from competing results
- Stay within recommended character limits (60 chars for title, 155 for description)

## Step 6: Select the winner

Choose the single best title tag and meta description.

Explain:

- Why it should improve CTR
- Which search intent it targets
- How it differs from competing results

## Step 7: Implement

Update:

- Title tag
- Meta description

Only make content changes if they directly support the promise made in the title or description.

---

## Success criteria

- Stronger click appeal
- Better intent matching
- Clear differentiation in the SERP
- No clickbait
- Higher expected CTR`;
}

function buildClaudePrompt(o: Opportunity): string {
  if (o.type === "low-ctr") return buildCtrPrompt(o);

  const metricsLines: string[] = [];
  if (o.metrics.clicks !== undefined) metricsLines.push(`- Clicks: ${o.metrics.clicks}`);
  if (o.metrics.impressions !== undefined) metricsLines.push(`- Impressions: ${o.metrics.impressions}`);
  if (o.metrics.ctr !== undefined) metricsLines.push(`- CTR: ${(o.metrics.ctr * 100).toFixed(2)}%`);
  if (o.metrics.position !== undefined) metricsLines.push(`- Avg position: ${o.metrics.position.toFixed(1)}`);
  if (o.metrics.clicksDelta !== undefined) metricsLines.push(`- Clicks change: ${o.metrics.clicksDelta > 0 ? "+" : ""}${o.metrics.clicksDelta}`);
  if (o.metrics.impressionsDelta !== undefined) metricsLines.push(`- Impressions change: ${o.metrics.impressionsDelta > 0 ? "+" : ""}${o.metrics.impressionsDelta}`);

  const context = [
    o.page ? `**Page:** ${o.page}` : "",
    o.query ? `**Query:** ${o.query}` : "",
    `**Issue:** ${o.issue}`,
    `**Why it matters:** ${o.whyItMatters}`,
    metricsLines.length ? `**Current metrics:**\n${metricsLines.join("\n")}` : "",
    `**Goal:** ${o.recommendedAction}`,
    `**Expected impact:** ${o.estimatedImpact}`,
  ].filter(Boolean).join("\n\n");

  return `Your task is to recover lost SEO visibility for this page.

## Context

${context}

IMPORTANT: Do not make any changes until you have completed the audit, research, and gap analysis.

---

## Step 1: Read the page

Read the page in full and understand:

- Search intent
- Existing content structure
- Topics currently covered
- Existing headings and sections

## Step 2: Analyze query losses

Use the provided GSC data.

Identify:

- Queries with the largest impression losses
- Queries with the largest click losses
- Queries with declining average position
- Query themes that lost visibility

Group findings into themes and rank them by opportunity.

If query-level data is unavailable, infer likely gaps from competitor analysis and current rankings.

## Step 3: Research

Research the topic and identify:

- Topics covered by competing pages
- Missing subtopics
- Missing FAQs
- Missing examples
- Missing entities
- Long-tail keyword opportunities

When researching competitors, focus on identifying information gain.

Do not merely match competitor content. Identify useful information, examples, frameworks, data, tools, comparisons, or insights that are missing from this page and would make it more helpful than competing results.

## Step 4: Gap analysis

Compare the research findings against the current page.

List:

- Missing sections
- Weak sections
- Outdated information
- Internal linking opportunities

Prioritize findings by likely SEO impact.

## Step 5: Create a concise implementation plan

Limit to:

- Top 5 content additions
- Top 3 content improvements
- Top 5 internal links

Focus on highest-impact opportunities only.

For every proposed content change, cite the reason:

- Lost query theme
- Competitor gap
- Missing search intent
- Information gain opportunity

Do not make changes that cannot be justified by at least one of these.

## Step 6: Implement

Avoid generic introductory content. Assume the reader already understands the basics and prioritize actionable, specific, experience-based information.

Do not add sections solely to increase word count.

When possible, modify existing sections instead of creating new sections.

Only add a new section when:
- The topic is not already covered
- The topic represents a meaningful query opportunity
- The topic cannot be incorporated naturally into an existing section

Once the plan is complete:

- Edit the page directly
- Improve existing sections first
- Add new sections only where a clear gap exists
- Add FAQs
- Improve internal linking
- Preserve existing formatting and style

## Step 7: Summary

Provide:

- Files changed
- Sections added
- Word count added
- Major SEO improvements made

Focus only on changes that are likely to recover lost impressions.

---

## Success criteria

- Page better satisfies search intent
- Lost query themes are covered
- Content depth exceeds top-ranking competitors
- New content is integrated naturally into the existing article
- Changes are implemented directly, not merely recommended`;
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

        {opportunity.page && (
          <div className="flex gap-2">
            <Link
              href={`/content-refresh?url=${encodeURIComponent(opportunity.page)}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Fix this page
            </Link>
            <Link
              href={`/page-grader?url=${encodeURIComponent(opportunity.page)}`}
              title="Grade this page"
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <Gauge className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
