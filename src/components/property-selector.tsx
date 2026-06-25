"use client";

import { useEffect, useState, useTransition } from "react";
import { Globe, ChevronDown, Loader2, FlaskConical, X } from "lucide-react";
import { getProperties, selectProperty, enableDemoMode } from "@/app/actions/gsc";
import type { ConnectionStatus, GscProperty } from "@/lib/types";

export function PropertySelector({ status }: { status: ConnectionStatus }) {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<GscProperty[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentLabel = status.demo
    ? "trailgearhub.com (demo)"
    : status.property
    ? status.property.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  useEffect(() => {
    if (!open || !status.connected) return;
    setLoading(true);
    getProperties()
      .then(({ properties, error }) => {
        if (error) setLoadError(error);
        else setProperties(properties);
      })
      .catch(() => setLoadError("Failed to load properties"))
      .finally(() => setLoading(false));
  }, [open, status.connected]);

  const handleSelect = (siteUrl: string) => {
    setOpen(false);
    startTransition(async () => {
      await selectProperty(siteUrl);
      window.location.reload();
    });
  };

  const handleDemo = () => {
    setOpen(false);
    startTransition(async () => {
      await enableDemoMode();
      window.location.reload();
    });
  };

  if (!status.connected && !status.demo) return null;

  return (
    <div className="relative px-3 pb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 px-3 py-2 transition-colors text-left"
      >
        {status.demo ? (
          <FlaskConical className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate min-w-0">
          {isPending ? "Switching…" : currentLabel ?? "Select property"}
        </span>
        {isPending ? (
          <Loader2 className="w-3 h-3 text-slate-400 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute left-0 right-0 mt-1 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-slate-300 dark:border-slate-500 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Switch property
              </p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}

              {loadError && (
                <p className="text-xs text-rose-600 px-2 py-2">{loadError}</p>
              )}

              {!loading && !loadError && properties.map((p) => {
                const label = p.siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
                const isActive = status.property === p.siteUrl && !status.demo;
                return (
                  <button
                    key={p.siteUrl}
                    onClick={() => handleSelect(p.siteUrl)}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/20 dark:text-indigo-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{label}</span>
                    {isActive && <span className="ml-auto text-indigo-400 text-[10px]">active</span>}
                  </button>
                );
              })}

              <button
                onClick={handleDemo}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  status.demo
                    ? "bg-amber-50 text-amber-700 font-semibold dark:bg-amber-900/20 dark:text-amber-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>Demo mode (trailgearhub.com)</span>
                {status.demo && <span className="ml-auto text-amber-400 text-[10px]">active</span>}
              </button>
            </div>

            {!status.connected && (
              <div className="border-t border-slate-100 p-2">
                <a
                  href="/api/auth/google"
                  className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Connect Google Search Console
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
