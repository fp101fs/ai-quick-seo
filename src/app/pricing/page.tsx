"use client";

import Link from "next/link";
import { Check, Crown, ArrowLeft, Zap } from "lucide-react";
import { useState } from "react";

const freeFeatures = [
  "Connect Google Search Console",
  "Daily SEO task list",
  "Traffic decline detection",
  "Quick win finder",
  "$0.10/mo of AI-powered features",
  "Demo mode (no account needed)",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited AI usage ($10/mo value)",
  "AI Content Refresh drafts",
  "Internal Link Finder (AI suggestions)",
  "AI SEO Coach (unlimited chat)",
  "Competitor Spy analysis",
  "Priority support",
];

function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/api/auth/google";
        return;
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
    >
      <Crown className="w-4 h-4 text-amber-300" />
      {loading ? "Loading…" : "Get Pro — $10/mo"}
    </button>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-512.png" className="w-8 h-8 rounded-lg" alt="SerpDo" />
            <span className="font-bold tracking-tight">SerpDo</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Start free with demo data. Upgrade when you&apos;re ready to connect your real site and
            unlock unlimited AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-2xl p-8 ring-1 ring-slate-200 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Free
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">No credit card required.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl p-8 ring-2 ring-indigo-500 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                Most popular
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                Pro
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$10</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">Cancel any time.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <CheckoutButton />
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Questions?{" "}
          <a href="mailto:support@ai-seo.app" className="text-indigo-600 hover:underline">
            support@ai-seo.app
          </a>
        </p>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
