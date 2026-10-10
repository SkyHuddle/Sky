"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/primitives";
import { LineupShowcase, type ShowcasePlayer } from "./Showcase";
import type { BuilderState } from "./useBuilder";

export interface SubmitError {
  code: string;
  message: string;
}

/**
 * Roster review: the five players presented as a team announcement, with every rule checked in
 * words (never colour alone), the captain choice, Autopilot, and the submit action.
 */
export function Review({
  data,
  b,
  signedIn,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  data: BuilderData;
  b: BuilderState;
  nowIso?: string;
  signedIn: boolean;
  submitting: boolean;
  error: SubmitError | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const teamOverLimit = [...b.summary.teamCounts.values()].some((n) => n > data.rules.maxPerTeam);
  const eliminated = b.playerIds.filter((id) => b.ineligible.has(id));
  const checks = [
    { ok: b.playerIds.length === data.rules.rosterSize, text: `${b.playerIds.length} of ${data.rules.rosterSize} players picked` },
    { ok: b.summary.salaryRemaining >= 0, text: b.summary.salaryRemaining >= 0 ? `Under the ${money(data.rules.salaryCap)} cap (${money(b.summary.salaryRemaining)} left)` : `${money(-b.summary.salaryRemaining)} over the cap` },
    { ok: !teamOverLimit, text: `No more than ${data.rules.maxPerTeam} players from one team` },
    { ok: !!b.captainId && b.playerIds.includes(b.captainId), text: b.captainId && b.playerIds.includes(b.captainId) ? `Captain chosen (scores ${data.rules.captainMultiplier}×)` : "Choose a captain: tap a player" },
    ...(eliminated.length ? [{ ok: false, text: `Replace ${eliminated.length} eliminated player${eliminated.length > 1 ? "s" : ""} (free)` }] : []),
    ...(b.transfers
      ? [{ ok: !b.transfers.error, text: `${b.transfers.discretionary.length} of ${b.transfers.allowed} transfers used${b.transfers.free.length ? ` · ${b.transfers.free.length} free replacement${b.transfers.free.length > 1 ? "s" : ""}` : ""}` }]
      : []),
  ];
  const valid = checks.every((c) => c.ok);
  const players: ShowcasePlayer[] = b.playerIds.map((id) => {
    const p = b.byId.get(id);
    const out = b.ineligible.get(id);
    return { id, nickname: p?.nickname ?? out?.nickname ?? "?", team: data.teams[p?.teamId ?? out?.teamId ?? ""], price: p?.price ?? out?.price ?? 0, eliminated: !!out };
  });
  const hasCaptain = !!b.captainId && b.playerIds.includes(b.captainId);
  const teamsUsed = b.summary.teamCounts.size;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-[760px]">
      <Button variant="ghost" icon="chevronLeft" onClick={onBack} className="-ml-3">
        Edit players
      </Button>
      <h1 className="mt-2 text-display text-ink">Your team</h1>
      <p className="mt-1 text-callout text-ink-2">
        {hasCaptain ? (
          <>
            Tap a player to make them captain.
          </>
        ) : (
          <>
            <span className="font-semibold text-lavender">Choose a captain.</span> Tap a player: their points count {data.rules.captainMultiplier}×.
          </>
        )}
      </p>

      <div className="mt-4">
        <LineupShowcase
          players={players}
          captainId={hasCaptain ? b.captainId : null}
          captainMultiplier={data.rules.captainMultiplier}
          onCaptain={(id) => b.setCaptainId(id)}
          header={
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-eyebrow text-ink-3">
                {data.tournament.shortName} · {data.contest.name}
              </span>
              <span className="text-caption text-ink-3">{data.window?.stageName}</span>
            </div>
          }
          footer={
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div>
                <dt className="text-caption text-ink-3">Salary used</dt>
                <dd className="num text-callout text-ink">{money(b.summary.salaryUsed)}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-3">Remaining</dt>
                <dd className={cn("num text-callout", b.summary.salaryRemaining < 0 ? "text-negative" : "text-ink")}>{money(b.summary.salaryRemaining)}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-3">Teams</dt>
                <dd className="num text-callout text-ink">{teamsUsed}</dd>
              </div>
            </dl>
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="checks" className="rounded-2xl bg-surface p-4">
          <h2 id="checks" className="text-headline text-ink">
            Lineup rules
          </h2>
          <ul className="mt-3 space-y-2">
            {checks.map((c) => (
              <li key={c.text} className="flex items-center gap-2.5 text-callout">
                <span className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full", c.ok ? "bg-accent-soft text-accent" : "bg-negative-soft text-negative")}>
                  <Icon name={c.ok ? "check" : "x"} size={12} strokeWidth={3} />
                </span>
                <span className={c.ok ? "text-ink-2" : "text-ink"}>
                  <span className="sr-only">{c.ok ? "Passed: " : "Needs attention: "}</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="autopilot" className="rounded-2xl bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender-soft text-lavender">
              <Icon name="autopilot" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="autopilot" className="text-headline text-ink">
                Autopilot
              </h2>
              <p className="mt-0.5 text-footnote text-ink-2">
                If you don&apos;t come back before a stage locks, eliminated players are replaced with the most-picked player you can afford. It never touches players who are still in.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={b.autopilot}
              aria-labelledby="autopilot"
              onClick={() => b.setAutopilot(!b.autopilot)}
              className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", b.autopilot ? "bg-accent" : "bg-raised ring-1 ring-border-strong")}
            >
              <span className={cn("absolute top-0.5 left-0 size-6 rounded-full bg-white shadow transition-transform", b.autopilot ? "translate-x-[22px]" : "translate-x-0.5")} />
            </button>
          </div>
        </section>
      </div>

      {error ? (
        <Notice tone={error.code === "LOCKED" ? "warning" : "danger"} className="mt-4">
          <p className="font-semibold">{error.code === "LOCKED" ? "This stage just locked" : "Your team wasn't submitted"}</p>
          <p className="mt-0.5 text-ink-2">{error.message} Your picks are kept on this device.</p>
        </Notice>
      ) : null}

      <div className="pb-safe sticky bottom-0 mt-6 -mx-4 border-t border-border bg-bg px-4 pt-3 pb-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        {signedIn ? (
          <Button size="lg" block onClick={onSubmit} loading={submitting} disabled={!valid} icon="lock">
            {data.saved ? "Save Changes" : "Submit Team"}
          </Button>
        ) : (
          <ButtonLink size="lg" block href={`/signup?next=${encodeURIComponent(`/c/${data.contest.id}/build?step=review`)}`} icon="user">
            Create an account to submit
          </ButtonLink>
        )}
        {!valid ? <p className="mt-2 text-center text-footnote text-ink-2">{checks.find((c) => !c.ok)?.text}</p> : null}
        {!signedIn ? <p className="mt-2 text-center text-footnote text-ink-3">Your picks are saved on this device while you sign up.</p> : null}
      </div>
    </motion.div>
  );
}
