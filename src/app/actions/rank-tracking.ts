"use server";

import { getUserId, getSelectedProperty } from "@/lib/services/session";
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
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return [];
  const prop = property ?? "";
  const rows = await getKeywordsWithLatestPositions(userId, prop);
  // ponytail: auto-capture today on every visit so "vs yesterday" works next day
  const missing = rows.filter((r) => r.today == null);
  if (missing.length) {
    const today = await todayStr();
    await Promise.all(
      missing.map(async (r) => {
        const pos = await positionFromSnapshot(r.keyword);
        await upsertKeywordPosition(userId, r.keyword, today, pos);
      })
    );
    return getKeywordsWithLatestPositions(userId, prop);
  }
  return rows;
}

export async function addKeyword(keyword: string) {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return;
  const kw = keyword.trim().toLowerCase();
  if (!kw) return;
  await addTrackedKeyword(userId, kw, property ?? "");
  const position = await positionFromSnapshot(kw);
  await upsertKeywordPosition(userId, kw, await todayStr(), position);
}

export async function removeKeyword(keyword: string) {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return;
  await removeTrackedKeyword(userId, keyword, property ?? "");
}

export async function refreshPositions() {
  const [userId, property] = await Promise.all([getUserId(), getSelectedProperty()]);
  if (!userId) return;
  const rows = await getKeywordsWithLatestPositions(userId, property ?? "");
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
