import { NextResponse } from "next/server";
import { getUsageStatus } from "@/lib/services/usage";

export async function GET() {
  try {
    const status = await getUsageStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ userId: null, spentUsd: 0, capUsd: 0.10, isPro: false, blocked: false });
  }
}
