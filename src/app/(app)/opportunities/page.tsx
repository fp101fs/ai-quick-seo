"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConnectGate } from "@/components/connect-gate";
import { OpportunityCard } from "@/components/opportunity-card";
import { PageHeader } from "@/components/page-header";
import { getOpportunities } from "@/app/actions/seo";
import type { ConnectionStatus, Opportunity, OpportunityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const filters: { value: OpportunityType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "declining-clicks", label: "Losing clicks" },
  { value: "declining-impressions", label: "Losing visibility" },
  { value: "quick-win", label: "Quick wins" },
  { value: "low-ctr", label: "Low CTR" },
];

export default function OpportunitiesPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OpportunityType | "all">("all");

  const fetchData = useCallback(
    () =>
      getOpportunities()
        .then((data) => {
          setStatus(data.status);
          setOpportunities(data.opportunities);
        })
        .catch((error: Error) => toast.error(error.message))
        .finally(() => setLoading(false)),
    []
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered =
    filter === "all" ? opportunities : opportunities.filter((o) => o.type === filter);

  return (
    <div>
      <PageHeader
        title="SEO Opportunities"
        description="Issues and openings detected in your Search Console data, ranked by impact."
        action={
          status?.connected || status?.demo ? (
            <Button variant="outline" onClick={load} className="border-slate-200">
              <RefreshCw className="w-4 h-4" />
              Re-analyze
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : status && !status.connected && !status.demo ? (
        <ConnectGate status={status} onReady={load} />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            {filters.map((f) => {
              const count =
                f.value === "all"
                  ? opportunities.length
                  : opportunities.filter((o) => o.type === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                    filter === f.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "ml-1.5 text-xs",
                      filter === f.value ? "text-indigo-200" : "text-slate-400"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No opportunities in this category
              </h3>
              <p className="text-slate-500">
                That usually means things are healthy here. Try another filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
