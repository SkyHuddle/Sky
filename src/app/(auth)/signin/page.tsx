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
      <h1 className="text-display text-ink">Welcome back</h1>
      <p className="mt-1.5 mb-7 text-body text-ink-2">Sign in to manage your teams and leagues.</p>
      <AuthForm mode="signin" next={next} />
      {isDemoMode() ? (
        <p className="mt-6 rounded-xl bg-lavender-soft px-4 py-3 text-footnote text-lavender">
          Demo account: <span className="font-semibold">demo</span> / <span className="font-semibold">lockin-demo</span>
        </p>
      ) : null}
    </div>
  );
}
