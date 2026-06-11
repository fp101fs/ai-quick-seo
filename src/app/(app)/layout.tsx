import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { getConnectionStatus } from "@/lib/services/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await getConnectionStatus();

  return (
    <AppShell status={status}>
      <Toaster />
      {children}
    </AppShell>
  );
}
