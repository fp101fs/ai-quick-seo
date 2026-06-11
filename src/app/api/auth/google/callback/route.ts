import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/services/google-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, url.origin));
    response.cookies.delete("oauth_state");
    return response;
  };

  if (url.searchParams.get("error")) {
    // User canceled or Google refused the request before issuing a code.
    return redirect(
      `/dashboard?error=oauth_failed&reason=${encodeURIComponent(url.searchParams.get("error")!)}`
    );
  }
  if (!code) {
    return redirect("/dashboard?error=oauth_failed&reason=missing_code");
  }
  if (!state || state !== storedState) {
    return redirect("/dashboard?error=oauth_failed&reason=state_mismatch");
  }

  try {
    const tokens = await exchangeCode(code, url.origin);
    const response = redirect("/dashboard?connected=1");
    response.cookies.set("gsc_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    // A real connection replaces demo mode.
    response.cookies.delete("seo_demo");
    return response;
  } catch (error) {
    console.error("OAuth callback failed:", error);
    return redirect("/dashboard?error=oauth_failed&reason=token_exchange");
  }
}
