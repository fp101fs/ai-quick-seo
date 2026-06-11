import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, fetchGoogleUserInfo } from "@/lib/services/google-auth";
import { setUserId } from "@/lib/services/session";
import { upsertUser } from "@/lib/db";

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

    // Fetch user profile and upsert into DB
    let dbUserId: number | null = null;
    try {
      const profile = await fetchGoogleUserInfo(tokens.access_token);
      const user = await upsertUser({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      });
      dbUserId = user.id;
    } catch (err) {
      // DB might not be migrated yet in dev — don't block auth
      console.error("Failed to upsert user in DB:", err);
    }

    const response = redirect("/dashboard?connected=1");
    response.cookies.set("gsc_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    if (dbUserId !== null) {
      response.cookies.set("seo_user_id", String(dbUserId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    response.cookies.delete("seo_demo");
    return response;
  } catch (error) {
    console.error("OAuth callback failed:", error);
    return redirect("/dashboard?error=oauth_failed&reason=token_exchange");
  }
}
