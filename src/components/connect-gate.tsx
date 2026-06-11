"use client";

import { useEffect, useState } from "react";
import { Loader2, Globe, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { enableDemoMode, getProperties, selectProperty } from "@/app/actions/gsc";
import type { ConnectionStatus, GscProperty } from "@/lib/types";

/**
 * Shown when Search Console isn't fully set up: handles connecting Google,
 * picking a property, and entering demo mode.
 */
export function ConnectGate({
  status,
  onReady,
}: {
  status: ConnectionStatus;
  onReady: () => void;
}) {
  const [properties, setProperties] = useState<GscProperty[] | null>(null);
  const [busy, setBusy] = useState(false);
  const needsProperty = status.connected && !status.property;

  useEffect(() => {
    if (!needsProperty) return;
    getProperties()
      .then(setProperties)
      .catch((error: Error) => toast.error(error.message));
  }, [needsProperty]);

  const handleDemo = async () => {
    setBusy(true);
    try {
      await enableDemoMode();
      onReady();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setBusy(false);
    }
  };

  const handleSelect = async (siteUrl: string) => {
    setBusy(true);
    try {
      await selectProperty(siteUrl);
      onReady();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setBusy(false);
    }
  };

  if (needsProperty) {
    return (
      <Card className="bg-white border-none shadow-sm ring-slate-200 max-w-xl mx-auto">
        <CardContent className="py-8 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Google connected</h2>
            <p className="text-slate-500 text-sm mt-1">
              Pick the Search Console property you want your AI employee to work on.
            </p>
          </div>
          {properties === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
          ) : properties.length === 0 ? (
            <p className="text-sm text-slate-500">
              No verified properties found on this Google account.
            </p>
          ) : (
            <div className="space-y-2 text-left">
              {properties.map((p) => (
                <button
                  key={p.siteUrl}
                  disabled={busy}
                  onClick={() => handleSelect(p.siteUrl)}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{p.siteUrl.replace(/^sc-domain:/, "")}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
        <Globe className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        Connect Google Search Console
      </h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Your AI employee analyzes your real search performance to find the
        highest-impact actions. Read-only access — we never change anything.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {status.googleConfigured ? (
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-6"
            render={<a href="/api/auth/google" />}
            nativeButton={false}
          >
            <Globe className="w-4 h-4" />
            Connect Google account
          </Button>
        ) : (
          <Button size="lg" disabled className="rounded-full px-6">
            <Globe className="w-4 h-4" />
            Google OAuth not configured
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          disabled={busy}
          onClick={handleDemo}
          className="rounded-full px-6 border-slate-200"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlaskConical className="w-4 h-4" />
          )}
          Explore with demo data
        </Button>
      </div>
      {!status.googleConfigured && (
        <p className="text-xs text-slate-400 mt-4">
          Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable the real
          integration, or explore the product with demo data.
        </p>
      )}
    </div>
  );
}
