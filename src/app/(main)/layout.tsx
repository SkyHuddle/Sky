import { AppShell } from "@/components/shell/AppShell";
import { pageContext } from "@/server/page";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { viewer, demo, now } = await pageContext();
  return (
    <AppShell viewer={viewer} demo={demo} now={now.toISOString()}>
      {children}
    </AppShell>
  );
}
