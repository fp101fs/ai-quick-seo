import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserId } from "@/lib/services/session";
import {
  getUserById,
  getMonthlyUsageCost,
  getUserSubscription,
  FREE_CAP_USD,
  sql,
} from "@/lib/db";
import { Crown, ArrowLeft } from "lucide-react";

export default async function UsagePage() {
  const userId = await getUserId();
  if (!userId) redirect("/api/auth/google");

  let user = null;
  let spentUsd = 0;
  let isPro = false;
  let recentUsage: Array<{
    feature: string;
    model: string;
    cost_usd: string;
    prompt_tokens: number;
    completion_tokens: number;
    created_at: string;
  }> = [];

  try {
    const [dbUser, spent, sub, usageRows] = await Promise.all([
      getUserById(userId),
      getMonthlyUsageCost(userId),
      getUserSubscription(userId),
      sql`
        SELECT feature, model, cost_usd, prompt_tokens, completion_tokens, created_at
        FROM ai_usage
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `,
    ]);
    user = dbUser;
    spentUsd = spent;
    isPro = sub !== null;
    recentUsage = usageRows.rows as typeof recentUsage;
  } catch {
    // DB not migrated yet
  }

  const capUsd = isPro ? 10 : FREE_CAP_USD;
  const usedPct = capUsd > 0 ? Math.min((spentUsd / capUsd) * 100, 100) : 0;

  function barColor(pct: number) {
    if (pct >= 95) return "bg-red-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-indigo-500";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Usage & Billing</h1>
      </div>

      {/* Plan overview */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Current plan
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {isPro ? "Pro" : "Free"}
              </span>
              {isPro && (
                <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
          </div>
          {!isPro && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              Upgrade to Pro
            </Link>
          )}
          {isPro && (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-xl transition-colors"
              >
                Manage billing →
              </button>
            </form>
          )}
        </div>

        {/* Usage bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-medium">
              AI usage this month
            </span>
            <span className="text-slate-900 font-semibold">
              ${spentUsd.toFixed(4)}
              <span className="text-slate-400 font-normal">
                {" "}/ {isPro ? "$10.00" : `$${capUsd.toFixed(2)}`}
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor(usedPct)}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Resets on the 1st of each month.{" "}
            {!isPro && "Free tier includes $0.10/mo of AI usage."}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "This month", value: `$${spentUsd.toFixed(4)}` },
          { label: "Plan cap", value: isPro ? "$10.00" : "$0.10" },
          { label: "Recent requests", value: recentUsage.length.toString() },
          {
            label: "Plan",
            value: isPro ? "Pro" : "Free",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl ring-1 ring-slate-200 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent usage table */}
      {recentUsage.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent AI requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tokens in
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tokens out
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentUsage.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-slate-700 capitalize">
                      {row.feature.replace(/-/g, " ")}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs truncate max-w-[160px]">
                      {row.model}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      {row.prompt_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      {row.completion_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      ${parseFloat(row.cost_usd).toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentUsage.length === 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-12 text-center">
          <p className="text-slate-400">No AI usage recorded yet this month.</p>
          <Link
            href="/coach"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 hover:underline"
          >
            Try the AI Coach →
          </Link>
        </div>
      )}
    </div>
  );
}
