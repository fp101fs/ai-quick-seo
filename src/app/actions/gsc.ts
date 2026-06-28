"use server";

import { cookies } from "next/headers";
import type { ConnectionStatus, GscProperty } from "@/lib/types";
import { getValidAccessToken } from "@/lib/services/google-auth";
import { listProperties } from "@/lib/services/gsc";
import { cacheDelete } from "@/lib/services/store";
import { SITEMAP_COOKIE } from "@/lib/services/context";
import {
  clearSession,
  getConnectionStatus,
  getSelectedProperty,
  getUserId,
  setDemoMode,
  setSelectedProperty,
} from "@/lib/services/session";

export async function getStatus(): Promise<ConnectionStatus> {
  return getConnectionStatus();
}

export async function getProperties(): Promise<{ properties: GscProperty[]; error: string | null }> {
  try {
    const accessToken = await getValidAccessToken();
    const properties = await listProperties(accessToken);
    return { properties, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load Search Console properties.";
    return { properties: [], error: message };
  }
}

export async function selectProperty(siteUrl: string): Promise<ConnectionStatus> {
  if (!siteUrl) throw new Error("Property is required");

  // Clear in-memory snapshot cache for both old and new property
  const prev = await getSelectedProperty();
  if (prev) cacheDelete(`gsc:${prev}`);
  cacheDelete(`gsc:${siteUrl}`);

  // Clear sitemap cookie + crawl cache — they're property-specific
  const cookieStore = await cookies();
  const oldSitemap = cookieStore.get(SITEMAP_COOKIE)?.value;
  if (oldSitemap) {
    cacheDelete(`crawl:${oldSitemap}`);
    cookieStore.delete(SITEMAP_COOKIE);
  }

  // Clear DB-backed snapshot cache so next fetch is fresh from GSC API
  try {
    const [{ deleteCachedSnapshot }, userId] = await Promise.all([import("@/lib/db"), getUserId()]);
    const uid = userId ?? undefined;
    await Promise.all([
      prev ? deleteCachedSnapshot(prev, uid) : Promise.resolve(),
      deleteCachedSnapshot(siteUrl, uid),
    ]);
  } catch {
    // DB unavailable — in-memory clear above is sufficient
  }

  await setSelectedProperty(siteUrl);
  await setDemoMode(false);
  return getConnectionStatus();
}

export async function enableDemoMode(): Promise<ConnectionStatus> {
  const cookieStore = await cookies();
  const oldSitemap = cookieStore.get(SITEMAP_COOKIE)?.value;
  if (oldSitemap) {
    cacheDelete(`crawl:${oldSitemap}`);
    cookieStore.delete(SITEMAP_COOKIE);
  }
  await setDemoMode(true);
  return getConnectionStatus();
}

export async function disconnect(): Promise<ConnectionStatus> {
  await clearSession();
  return getConnectionStatus();
}
