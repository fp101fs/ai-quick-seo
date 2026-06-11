import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { getConnectionStatus, getUserId } from "@/lib/services/session";

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
  let capUsd = 0.10;

  if (userId) {
    try {
      const db = await import("@/lib/db");
      const [dbUser, spent, sub] = await Promise.all([
        db.getUserById(userId),
        db.getMonthlyUsageCost(userId),
        db.getUserSubscription(userId),
      ]);
      user = dbUser;
      spentUsd = spent;
      isPro = sub !== null;
      capUsd = isPro ? 10 : db.FREE_CAP_USD;
    } catch {
      // DB unavailable or not yet migrated — degrade gracefully
    }
  }

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
