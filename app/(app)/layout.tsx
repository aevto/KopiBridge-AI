import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credit-status";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const credits = await getCreditStatus(user.id);
  return (
    <AppShell email={user.email ?? "Signed-in user"} credits={credits}>
      {children}
    </AppShell>
  );
}
