import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { getConnectionStatus, getUserId } from "@/lib/services/session";
import { getUserById, getMonthlyUsageCost, getUserSubscription, FREE_CAP_USD } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, userId] = await Promise.all([
    getConnectionStatus(),
    getUserId(),
  ]);

  let user = null;
  let spentUsd = 0;
  let isPro = false;

  if (userId) {
    try {
      const [dbUser, spent, sub] = await Promise.all([
        getUserById(userId),
        getMonthlyUsageCost(userId),
        getUserSubscription(userId),
      ]);
      user = dbUser;
      spentUsd = spent;
      isPro = sub !== null;
    } catch {
      // DB not yet migrated or unavailable — degrade gracefully
    }
  }

  const capUsd = isPro ? 10 : FREE_CAP_USD;

  return (
    <AppShell
      status={status}
      user={user}
      isSignedIn={userId !== null}
      spentUsd={spentUsd}
      capUsd={capUsd}
      isPro={isPro}
    >
      <Toaster />
      {children}
    </AppShell>
  );
}
