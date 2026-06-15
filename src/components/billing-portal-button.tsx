"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No billing portal URL returned");
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
    >
      {loading ? "Loading…" : "Manage billing →"}
    </button>
  );
}
