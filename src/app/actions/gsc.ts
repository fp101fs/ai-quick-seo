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

export async function getProperties(): Promise<GscProperty[]> {
  const accessToken = await getValidAccessToken();
  return listProperties(accessToken);
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
