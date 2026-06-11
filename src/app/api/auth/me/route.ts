import { NextResponse } from "next/server";
import { getUserId } from "@/lib/services/session";
import { getUserById } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ signedIn: false });
    const user = await getUserById(userId);
    return NextResponse.json({
      signedIn: true,
      name: user?.name ?? null,
      email: user?.email ?? null,
      picture: user?.picture ?? null,
    });
  } catch {
    return NextResponse.json({ signedIn: false });
  }
}
