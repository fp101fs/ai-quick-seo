"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { X, Crown } from "lucide-react";
import { BillingPortalButton } from "@/components/billing-portal-button";
import Link from "next/link";

const ARC = {
  inline: { size: 28, r: 11, stroke: 2.5 },
  modal: { size: 96, r: 40, stroke: 5.5 },
} as const;

type ArcSize = keyof typeof ARC;

function arcColor(usedPct: number, dark = false) {
  if (usedPct >= 0.95) return dark ? "#fca5a5" : "#ef4444";
  if (usedPct >= 0.8)  return dark ? "#fcd34d" : "#f59e0b";
  return dark ? "#c7d2fe" : "#818cf8"; // indigo-200 / indigo-400
}

function daysUntilReset() {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function Arc({
  cfg,
  usedPct,
  children,
}: {
  cfg: (typeof ARC)[ArcSize];
  usedPct: number;
  children?: React.ReactNode;
}) {
  const { size, r, stroke } = cfg;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(usedPct, 1));
  const color = arcColor(usedPct);
  const c = size / 2;
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {children && (
        <span
          className="absolute text-slate-700 dark:text-slate-200 font-semibold pointer-events-none select-none"
          style={{ fontSize: Math.max(7, size * 0.19) }}
        >
          {children}
        </span>
      )}
    </div>
  );
}

function PlanUsageModal({
  spentUsd,
  capUsd,
  isPro,
  onClose,
}: {
  spentUsd: number;
  capUsd: number;
  isPro: boolean;
  onClose: () => void;
}) {
  const usedPct = capUsd > 0 ? spentUsd / capUsd : 0;
  const color = arcColor(usedPct);
  const days = daysUntilReset();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-slate-900 font-semibold text-lg">Plan usage</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <Arc cfg={ARC.modal} usedPct={usedPct}>
            {`${Math.round((1 - Math.min(usedPct, 1)) * 100)}%`}
          </Arc>

          <div className="mt-4 text-center">
            <p className="text-slate-900 font-medium">
              <span style={{ color }}>${spentUsd.toFixed(4)}</span>
              <span className="text-slate-500">
                {" "}
                of ${capUsd === Infinity ? "∞" : capUsd.toFixed(2)} used
              </span>
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {isPro ? "Pro" : "Free"} plan · resets in {days} day{days !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-5 w-full">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(usedPct * 100, 100)}%`,
                  background: color,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>$0</span>
              <span>{capUsd === Infinity ? "Unlimited" : `$${capUsd.toFixed(2)}`}</span>
            </div>
          </div>

          {!isPro && (
            <Link
              href="/pricing"
              onClick={onClose}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-colors font-medium"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              Upgrade to Pro — $10/mo
            </Link>
          )}

          {isPro && (
            <div className="mt-5 w-full flex justify-center">
              <BillingPortalButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface UsageMeterProps {
  spentUsd: number;
  capUsd: number;
  isPro: boolean;
}

export function UsageMeter({ spentUsd, capUsd, isPro }: UsageMeterProps) {
  const [showModal, setShowModal] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const usedPct = capUsd > 0 && capUsd !== Infinity ? spentUsd / capUsd : 0;
  const remainPct = Math.round((1 - Math.min(usedPct, 1)) * 100);
  const color = arcColor(usedPct, isDark);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-none"
        title="View plan usage"
      >
        <Arc cfg={ARC.inline} usedPct={usedPct} />
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          <span style={{ color }} className="font-semibold">
            {remainPct}%
          </span>{" "}
          left
        </span>
      </button>

      {showModal && (
        <PlanUsageModal
          spentUsd={spentUsd}
          capUsd={capUsd}
          isPro={isPro}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
