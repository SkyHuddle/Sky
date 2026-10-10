"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { PlayerCard } from "../player/PlayerCard";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/primitives";
import { Countdown } from "../ui/status";
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
  nowIso,
  signedIn,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  data: BuilderData;
  b: BuilderState;
  nowIso: string;
  signedIn: boolean;
  submitting: boolean;
  error: SubmitError | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const ordered = [...b.playerIds].sort((x, y) => (x === b.captainId ? -1 : y === b.captainId ? 1 : 0));
  const teamOverLimit = [...b.summary.teamCounts.values()].some((n) => n > data.rules.maxPerTeam);
  const eliminated = b.playerIds.filter((id) => b.ineligible.has(id));
  const checks = [
    { ok: b.playerIds.length === data.rules.rosterSize, text: `${b.playerIds.length} of ${data.rules.rosterSize} players picked` },
    { ok: b.summary.salaryRemaining >= 0, text: b.summary.salaryRemaining >= 0 ? `Under the ${money(data.rules.salaryCap)} cap (${money(b.summary.salaryRemaining)} left)` : `${money(-b.summary.salaryRemaining)} over the cap` },
    { ok: !teamOverLimit, text: `No more than ${data.rules.maxPerTeam} players from one team` },
    { ok: !!b.captainId && b.playerIds.includes(b.captainId), text: b.captainId ? "Captain chosen (scores 1.5×)" : "Choose a captain: tap the star on a player" },
    ...(eliminated.length ? [{ ok: false, text: `Replace ${eliminated.length} eliminated player${eliminated.length > 1 ? "s" : ""} (free)` }] : []),
    ...(b.transfers
      ? [{ ok: !b.transfers.error, text: `${b.transfers.discretionary.length} of ${b.transfers.allowed} transfers used${b.transfers.free.length ? ` · ${b.transfers.free.length} free replacement${b.transfers.free.length > 1 ? "s" : ""}` : ""}` }]
      : []),
  ];
  const valid = checks.every((c) => c.ok);
  const cardFor = (id: string, big: boolean) => {
    const p = b.byId.get(id);
    const out = b.ineligible.get(id);
    const team = data.teams[p?.teamId ?? out?.teamId ?? ""];
    const isCaptain = id === b.captainId;
    return (
      <PlayerCard
        key={id}
        size={big ? "lg" : "md"}
        captain={isCaptain}
        eliminated={!!out}
        team={team}
        player={{ nickname: p?.nickname ?? out?.nickname ?? "?", role: p?.role ?? "", nationality: p?.nationality ?? "", price: p?.price ?? out?.price ?? 0, avgPoints: p?.avgPoints }}
        footer={
          <button
            onClick={() => b.setCaptainId(id)}
            disabled={!!out}
            aria-pressed={isCaptain}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] text-footnote font-semibold transition-colors",
              isCaptain ? "bg-lavender-soft text-lavender" : "bg-elevated text-ink-2 hover:text-ink",
            )}
          >
            <Icon name="star" size={14} strokeWidth={2.2} />
            {isCaptain ? "Captain" : "Make captain"}
          </button>
        }
      />
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-eyebrow text-lavender">{data.tournament.shortName} · {data.contest.name}</div>
          <h1 className="mt-1 text-display text-ink">Your team</h1>
          {data.window ? (
            <p className="mt-1 text-callout text-ink-2">
              {data.window.stageName} locks in <Countdown to={data.window.lockAt} now={nowIso} className="font-semibold text-ink" />. You can edit until then.
            </p>
          ) : null}
        </div>
        <Button variant="secondary" icon="chevronLeft" onClick={onBack}>
          Edit players
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ordered[0] ? <div className="sm:col-span-2 lg:col-span-1 lg:row-span-1">{cardFor(ordered[0], true)}</div> : null}
        {ordered.slice(1).map((id) => (
          <div key={id}>{cardFor(id, false)}</div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="checks" className="rounded-2xl border border-border bg-surface p-4">
          <h2 id="checks" className="text-headline text-ink">
            Rules check
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
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-callout">
            <span className="text-ink-2">Total salary</span>
            <span className="tabular font-semibold text-ink">
              {money(b.summary.salaryUsed)} <span className="font-normal text-ink-3">/ {money(data.rules.salaryCap)}</span>
            </span>
          </div>
        </section>

        <section aria-labelledby="autopilot" className="rounded-2xl border border-border bg-surface p-4">
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
              <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform", b.autopilot ? "translate-x-[22px]" : "translate-x-0.5")} />
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

      <div className="pb-safe sticky bottom-0 mt-6 -mx-4 border-t border-border bg-bg/95 px-4 pt-3 pb-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        {signedIn ? (
          <Button size="lg" block onClick={onSubmit} loading={submitting} disabled={!valid} icon="lock">
            {data.saved ? "Save changes" : "Submit team"}
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
