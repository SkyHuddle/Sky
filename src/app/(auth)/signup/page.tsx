import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getViewer } from "@/server/http";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getViewer()) redirect(next);
  return (
    <div>
      <h1 className="text-display text-ink">Create your account</h1>
      <p className="mt-1.5 mb-7 text-body text-ink-2">Free to play. Your fantasy record follows you from tournament to tournament.</p>
      <AuthForm mode="signup" next={next} />
      <p className="mt-6 text-caption text-ink-3">No real money, no betting. Lockin is a free fantasy game.</p>
    </div>
  );
}
