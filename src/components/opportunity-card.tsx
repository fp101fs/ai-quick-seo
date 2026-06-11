import {
  TrendingDown,
  Eye,
  Zap,
  MousePointerClick,
  Lightbulb,
  Wrench,
  BarChart3,
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
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    iconColor: "text-rose-600",
  },
  "declining-impressions": {
    label: "Losing visibility",
    icon: Eye,
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    iconColor: "text-orange-600",
  },
  "quick-win": {
    label: "Quick win",
    icon: Zap,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-600",
  },
  "low-ctr": {
    label: "Low CTR",
    icon: MousePointerClick,
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    iconColor: "text-sky-600",
  },
};

const impactConfig = {
  high: "bg-indigo-600 text-white",
  medium: "bg-indigo-100 text-indigo-700",
  low: "bg-slate-100 text-slate-600",
};

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <Card className="bg-white border-none shadow-sm ring-slate-200 hover:ring-indigo-200 transition-all">
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
        <CardTitle className="text-slate-900 leading-snug mt-1">
          {opportunity.issue}
        </CardTitle>
        {opportunity.page && (
          <p className="text-xs text-slate-400 truncate font-mono">{opportunity.page}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">{opportunity.whyItMatters}</p>
        </div>
        <div className="flex gap-2.5">
          <Wrench className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 font-medium">{opportunity.recommendedAction}</p>
        </div>
        <div className="flex gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
          <BarChart3 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">{opportunity.estimatedImpact}</p>
        </div>
      </CardContent>
    </Card>
  );
}
