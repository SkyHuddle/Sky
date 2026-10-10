import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";
import { pageContext } from "@/server/page";
import { builderData } from "@/server/queries/contest";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  return { title: `Build your team · ${decodeURIComponent(contestId).split("--")[1] ?? "Contest"}` };
}

export default async function BuildPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const { db, viewer, now } = await pageContext();
  const data = await builderData(db, decodeURIComponent(contestId), viewer?.id ?? null, now);
  if (!data) notFound();
  return (
    <Suspense>
      <Builder data={data} nowIso={now.toISOString()} signedIn={!!viewer} />
    </Suspense>
  );
}
