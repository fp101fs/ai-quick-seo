import { NextRequest, NextResponse } from "next/server";
import { runMigrations } from "@/lib/db";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-migrate-secret");
  if (secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await runMigrations();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
