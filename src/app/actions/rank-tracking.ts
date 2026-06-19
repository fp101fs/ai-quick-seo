"use server";

import { getUserId } from "@/lib/services/session";
import { getCurrentSnapshot } from "@/lib/services/context";
import {
  addTrackedKeyword,
  getKeywordHistory,
  getKeywordsWithLatestPositions,
  removeTrackedKeyword,
  upsertKeywordPosition,
} from "@/lib/db";

async function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function positionFromSnapshot(keyword: string): Promise<number | null> {
  try {
    const snap = await getCurrentSnapshot();
    if (!snap?.queries?.length) return null;
    const kw = keyword.toLowerCase();
    const matches = snap.queries.filter((q) => q.query.toLowerCase() === kw);
    if (!matches.length) return null;
    const totalImp = matches.reduce((s, q) => s + q.impressions, 0);
    if (!totalImp) return matches[0].position;
    return matches.reduce((s, q) => s + q.position * q.impressions, 0) / totalImp;
  } catch { return null; }
}

export async function getTrackingData() {
  const userId = await getUserId();
  if (!userId) return [];
  return getKeywordsWithLatestPositions(userId);
}

export async function addKeyword(keyword: string) {
  const userId = await getUserId();
  if (!userId) return;
  const kw = keyword.trim().toLowerCase();
  if (!kw) return;
  await addTrackedKeyword(userId, kw);
  const position = await positionFromSnapshot(kw);
  await upsertKeywordPosition(userId, kw, await todayStr(), position);
}

export async function removeKeyword(keyword: string) {
  const userId = await getUserId();
  if (!userId) return;
  await removeTrackedKeyword(userId, keyword);
}

export async function refreshPositions() {
  const userId = await getUserId();
  if (!userId) return;
  const rows = await getKeywordsWithLatestPositions(userId);
  const today = await todayStr();
  await Promise.all(
    rows.map(async (r) => {
      const pos = await positionFromSnapshot(r.keyword);
      await upsertKeywordPosition(userId, r.keyword, today, pos);
    })
  );
}

export async function getKeywordChartData(keyword: string) {
  const userId = await getUserId();
  if (!userId) return [];
  return getKeywordHistory(userId, keyword);
}
