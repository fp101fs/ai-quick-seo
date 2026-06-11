import { getUserId } from "@/lib/services/session";
import { getMonthlyUsageCost, getUserSubscription, FREE_CAP_USD } from "@/lib/db";

export interface UsageStatus {
  userId: number | null;
  spentUsd: number;
  capUsd: number;
  isPro: boolean;
  blocked: boolean;
}

export async function getUsageStatus(): Promise<UsageStatus> {
  const userId = await getUserId();

  if (!userId) {
    return { userId: null, spentUsd: 0, capUsd: FREE_CAP_USD, isPro: false, blocked: false };
  }

  const [spent, sub] = await Promise.all([
    getMonthlyUsageCost(userId).catch(() => 0),
    getUserSubscription(userId).catch(() => null),
  ]);

  const isPro = sub !== null;
  const capUsd = isPro ? 10 : FREE_CAP_USD;
  const blocked = !isPro && spent >= FREE_CAP_USD;

  return { userId, spentUsd: spent, capUsd, isPro, blocked };
}
