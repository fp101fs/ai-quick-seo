import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/services/google-auth";
import { isGoogleConfigured } from "@/lib/services/session";

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard?error=google_not_configured", request.url)
    );
  }

  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(buildAuthUrl(origin, state));
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });
  return response;
}
