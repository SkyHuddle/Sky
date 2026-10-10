import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getViewer } from "@/server/http";
import { isDemoMode } from "@/server/clock";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getViewer()) redirect(next);
  return (
    <div>
      <h1 className="text-title text-ink">Welcome back</h1>
      <p className="mt-1 mb-6 text-callout text-ink-2">Sign in to manage your teams and leagues.</p>
      <AuthForm mode="signin" next={next} demo={isDemoMode()} />
    </div>
  );
}
