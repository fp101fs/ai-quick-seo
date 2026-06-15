// Cookie-backed session helpers. Google tokens and the selected property
// live in httpOnly cookies so no persistence layer is needed.

import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import type { ConnectionStatus, GscTokens } from "@/lib/types";

const TOKENS_COOKIE = "gsc_tokens";
const PROPERTY_COOKIE = "gsc_property";
const DEMO_COOKIE = "seo_demo";
const USER_ID_COOKIE = "seo_user_id";
const HMAC_SECRET = () => process.env.SESSION_SECRET ?? "dev-secret-change-in-prod";

export async function getTokens(): Promise<GscTokens | null> {
  const store = await cookies();
  const raw = store.get(TOKENS_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GscTokens;
  } catch {
    return null;
  }
}

export async function setTokens(tokens: GscTokens): Promise<void> {
  const store = await cookies();
  store.set(TOKENS_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(TOKENS_COOKIE);
  store.delete(PROPERTY_COOKIE);
  store.delete(DEMO_COOKIE);
  store.delete(USER_ID_COOKIE);
}

export async function getUserId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(USER_ID_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;
  const idPart = raw.slice(0, dot);
  const sigPart = raw.slice(dot + 1);
  if (!idPart || !sigPart) return null;
  const id = parseInt(idPart, 10);
  if (isNaN(id)) return null;
  const expected = createHmac("sha256", HMAC_SECRET())
    .update(idPart)
    .digest("hex");
  if (sigPart !== expected) return null;
  return id;
}

export async function setUserId(id: number): Promise<void> {
  const store = await cookies();
  const idStr = String(id);
  const sig = createHmac("sha256", HMAC_SECRET()).update(idStr).digest("hex");
  store.set(USER_ID_COOKIE, `${idStr}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSelectedProperty(): Promise<string | null> {
  const store = await cookies();
  return store.get(PROPERTY_COOKIE)?.value ?? null;
}

export async function setSelectedProperty(siteUrl: string): Promise<void> {
  const store = await cookies();
  store.set(PROPERTY_COOKIE, siteUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isDemoMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === "1";
}

export async function setDemoMode(enabled: boolean): Promise<void> {
  const store = await cookies();
  if (enabled) {
    store.set(DEMO_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  } else {
    store.delete(DEMO_COOKIE);
  }
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const [tokens, property, demo] = await Promise.all([
    getTokens(),
    getSelectedProperty(),
    isDemoMode(),
  ]);
  return {
    connected: Boolean(tokens),
    demo,
    property: demo ? "https://trailgearhub.com/" : property,
    googleConfigured: isGoogleConfigured(),
  };
}
