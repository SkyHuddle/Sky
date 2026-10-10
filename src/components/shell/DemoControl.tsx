"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";
import { LocalTime } from "../ui/status";
import { useToast } from "../ui/Toast";
import { cn } from "@/lib/cn";

/**
 * Demo controls: clearly labelled, only rendered when DEMO_MODE=true. Moves the server's demo clock
 * to the end of the featured tournament's next stage so results arrive through the real pipeline.
 */
export function DemoControl({ now, signedIn, compact }: { now: string; signedIn: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ next: { label: string; target: string } | null; now: string } | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/demo/status");
    if (res.ok) setStatus(await res.json());
  }

  async function advance() {
    setBusy(true);
    try {
      const res = await fetch("/api/demo/advance", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Couldn't advance the demo");
      toast(`${body.step}: results are in`, "success");
      await load();
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't advance the demo", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          void load();
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full bg-lavender-soft px-3 text-[0.75rem] font-semibold text-lavender transition-colors hover:bg-lavender/20",
          compact && "px-2.5",
        )}
      >
        <Icon name="play" size={13} strokeWidth={2.4} />
        Demo
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Demo mode" description="Fictional teams and players. Results are simulated and released through the real scoring pipeline.">
        <div className="space-y-4">
          <div className="rounded-xl bg-elevated p-4">
            <div className="text-caption text-ink-3">Demo clock</div>
            <div className="mt-0.5 text-headline text-ink">
              <LocalTime iso={status?.now ?? now} />
            </div>
            <p className="mt-2 text-callout text-ink-2">
              Lineups lock, transfer windows open and scores update when this clock passes each match, exactly as they would with live data.
            </p>
          </div>
          {status && !status.next ? (
            <p className="text-callout text-ink-2">The demo Major is complete. Reseed with <code className="rounded bg-elevated px-1">npm run db:seed</code> to start again.</p>
          ) : null}
          {signedIn ? (
            <Button block size="lg" variant="lavender" icon="play" loading={busy} disabled={!status?.next} onClick={advance}>
              {status?.next ? status.next.label : "Loading…"}
            </Button>
          ) : (
            <p className="text-callout text-ink-2">Sign in to advance the demo.</p>
          )}
          <p className="text-caption text-ink-3">Advancing jumps to the end of the next stage of Meridian Major (Demo). Lineups for that stage lock first; Autopilot runs for anyone who didn&apos;t act.</p>
        </div>
      </Sheet>
    </>
  );
}
