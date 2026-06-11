"use server";

import type { ConnectionStatus, GscProperty } from "@/lib/types";
import { getValidAccessToken } from "@/lib/services/google-auth";
import { listProperties } from "@/lib/services/gsc";
import {
  clearSession,
  getConnectionStatus,
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
  await setSelectedProperty(siteUrl);
  await setDemoMode(false);
  return getConnectionStatus();
}

export async function enableDemoMode(): Promise<ConnectionStatus> {
  await setDemoMode(true);
  return getConnectionStatus();
}

export async function disconnect(): Promise<ConnectionStatus> {
  await clearSession();
  return getConnectionStatus();
}
