"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Crown } from "lucide-react";

const AUTH_HREF = "/api/auth/google";

interface MeData {
  signedIn: boolean;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

export function DashboardUserChip() {
  const [me, setMe] = useState<MeData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ signedIn: false }));
  }, []);

  if (!me) return null;

  if (!me.signedIn) {
    return (
      <a
        href={AUTH_HREF}
        className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </a>
    );
  }

  const initials = (me.name ?? me.email ?? "U")[0].toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/pricing"
        className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
      >
        <Crown className="w-3 h-3 text-amber-500" />
        Upgrade
      </Link>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-1.5 pr-3 py-1">
        {me.picture ? (
          <img src={me.picture} alt={me.name ?? ""} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-600">{initials}</span>
          </div>
        )}
        <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate hidden sm:block">
          {me.name ?? me.email}
        </span>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" title="Sign out" className="text-slate-400 hover:text-slate-600 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
