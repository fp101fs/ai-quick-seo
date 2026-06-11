// Google OAuth helpers for the Search Console (read-only) scope.
// Plain fetch — no googleapis dependency.

import type { GscTokens } from "@/lib/types";
import { getTokens, setTokens } from "@/lib/services/session";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export function getRedirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

export function buildAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCode(
  code: string,
  origin: string
): Promise<GscTokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google token exchange failed:", errorText);
    throw new Error("Failed to connect Google account");
  }

  const data: TokenResponse = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

async function refreshTokens(tokens: GscTokens): Promise<GscTokens> {
  if (!tokens.refresh_token) {
    throw new Error("Google session expired. Please reconnect your account.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google token refresh failed:", errorText);
    throw new Error("Google session expired. Please reconnect your account.");
  }

  const data: TokenResponse = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Returns a valid access token, refreshing it (and updating the session
 * cookie) when it is within a minute of expiring.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getTokens();
  if (!tokens) {
    throw new Error("Not connected to Google. Please connect your account first.");
  }

  if (Date.now() < tokens.expires_at - 60_000) {
    return tokens.access_token;
  }

  const refreshed = await refreshTokens(tokens);
  await setTokens(refreshed);
  return refreshed.access_token;
}
