"use server";

import { getUserId } from "@/lib/services/session";
import { getCurrentSnapshot } from "@/lib/services/context";
import { getSelectedProperty } from "@/lib/services/session";
import { gradePageSeo } from "@/lib/services/page-grader";
import type { GradeResult } from "@/lib/types";

export type { GradeResult, GradeCategory } from "@/lib/types";

async function resolveUrl(url: string): Promise<string> {
  let target = url.trim();
  if (target.startsWith("http://") || target.startsWith("https://")) return target;
  const property = await getSelectedProperty();
  const base =
    property && !property.startsWith("sc-domain:")
      ? property.replace(/\/$/, "")
      : property?.startsWith("sc-domain:")
      ? `https://${property.replace("sc-domain:", "")}`
      : null;
  if (base) return target.startsWith("/") ? `${base}${target}` : `${base}/${target}`;
  return `https://${target}`;
}

export async function gradePage(url: string): Promise<GradeResult> {
  if (!url) throw new Error("URL is required");
  const { getUsageStatus } = await import("@/lib/services/usage");
  const usage = await getUsageStatus();
  if (usage.blocked) throw new Error("You've reached the free AI limit ($0.10/mo). Upgrade to Pro.");

  const target = await resolveUrl(url);
  const snapshot = await getCurrentSnapshot().catch(() => null);
  const result = await gradePageSeo(target, snapshot, usage.userId ?? undefined);

  const userId = await getUserId();
  if (userId) {
    const { savePageGrade } = await import("@/lib/db");
    await savePageGrade(userId, target, result).catch(() => {});
  }
  return result;
}

export async function getPageGradeCache(
  url: string
): Promise<{ result: GradeResult; generatedAt: string } | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { getPageGrade } = await import("@/lib/db");
  const row = await getPageGrade(userId, url);
  if (!row) return null;
  return { result: row.result as GradeResult, generatedAt: row.generated_at };
}

export async function getGradedPagesList(): Promise<{ url: string; score: number; generated_at: string }[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { getAllPageGradeUrls } = await import("@/lib/db");
  const { getPropertyBaseUrl } = await import("@/app/actions/seo");
  const baseUrl = await getPropertyBaseUrl().catch(() => null);
  return getAllPageGradeUrls(userId, baseUrl ?? undefined).catch(() => []);
}
