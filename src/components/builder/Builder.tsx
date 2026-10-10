"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { BuilderData } from "@/server/queries/contest";
import { Button, ButtonLink, IconButton } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { DemoBadge, PlayerAvatar } from "../ui/identity";
import { EmptyState, Notice } from "../ui/primitives";
import { Countdown, StatePill } from "../ui/status";
import { useToast } from "../ui/Toast";
import { FilterChips, FilterPanel, SearchField } from "./Filters";
import { PlayerRow } from "./PlayerRow";
import { PlayerSheet } from "./PlayerSheet";
import { Review, type SubmitError } from "./Review";
import { RosterTray } from "./RosterTray";
import { useBuilder } from "./useBuilder";

type Step = "pick" | "review" | "done";

export function Builder({ data, nowIso, signedIn }: { data: BuilderData; nowIso: string; signedIn: boolean }) {
  const b = useBuilder(data);
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState<Step>(params.get("step") === "review" ? "review" : "pick");
  const [openPlayer, setOpenPlayer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
  const [result, setResult] = useState<{ entryId: string; created: boolean } | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Keep the URL in sync so a refresh (or returning from sign-up) lands on the same step.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (step === "review") url.searchParams.set("step", "review");
    else url.searchParams.delete("step");
    window.history.replaceState(null, "", url.toString());
  }, [step]);

  const editable = data.state === "open";
  const canReview = b.playerIds.length > 0;

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/contests/${encodeURIComponent(data.contest.id)}/entry`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerIds: b.playerIds, captainId: b.captainId, autopilot: b.autopilot }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError({ code: body?.error?.code ?? "ERROR", message: body?.error?.message ?? "Something went wrong." });
        return;
      }
      try {
        window.localStorage.removeItem(b.draftKey);
      } catch {
        /* storage unavailable */
      }
      setResult({ entryId: body.entryId, created: body.created });
      setStep("done");
      router.refresh();
    } catch {
      setError({ code: "OFFLINE", message: "You appear to be offline. Nothing was lost; try again when you're connected." });
    } finally {
      setSubmitting(false);
    }
  }, [data.contest.id, b.playerIds, b.captainId, b.autopilot, b.draftKey, router]);

  const onToggle = useCallback(
    (id: string) => {
      if (!editable) return;
      const adding = !b.playerIds.includes(id);
      b.toggle(id);
      if (adding && b.playerIds.length + 1 === data.rules.rosterSize) {
        toast(b.captainId && b.playerIds.includes(b.captainId) ? "Roster full. Review your team when ready." : "Roster full. Pick a captain on the review screen.", "success");
      }
    },
    [b, editable, data.rules.rosterSize, toast],
  );

  const opponentOf = useMemo(() => new Map(data.pool.map((p) => [p.id, p.nextOpponentId ? data.teams[p.nextOpponentId] : undefined])), [data.pool, data.teams]);
  const metric = data.state === "locked" ? "owned" : b.filters.sort === "value" ? "value" : "avg";

  // ── Not editable: locked, upcoming, completed ──────────────────────────────────────────
  if (data.state !== "open") {
    return (
      <Frame data={data} nowIso={nowIso}>
        <div className="mx-auto max-w-lg py-10">
          {data.state === "upcoming" ? (
            <EmptyState
              icon="calendar"
              title={data.contest.kind === "main_event" ? "Opens when Stage 3 is set" : "Entries aren't open yet"}
              body={
                data.contest.kind === "main_event"
                  ? "The Main Event starts with the 16 Stage 3 teams. Entries open as soon as Stage 2 finishes and those teams are known."
                  : "This contest opens closer to the event. Check back soon."
              }
              action={<ButtonLink href={`/t/${data.tournament.slug}/fantasy`} variant="secondary">Back to event</ButtonLink>}
            />
          ) : (
            <EmptyState
              icon="lock"
              title={data.state === "completed" ? "This contest has finished" : "Lineups are locked"}
              body={
                data.state === "completed"
                  ? "Final standings are in."
                  : data.contest.nextWindow
                    ? `${data.window?.stageName ?? "This stage"} is underway. The ${data.contest.nextWindow.stageName} transfer window opens when it ends.`
                    : "The final stage is underway."
              }
              action={
                <div className="flex gap-2.5">
                  {data.entryId ? <ButtonLink href={`/e/${data.entryId}`}>Your team</ButtonLink> : null}
                  <ButtonLink href={`/c/${data.contest.id}/leaderboard`} variant="secondary">
                    Standings
                  </ButtonLink>
                </div>
              }
            />
          )}
        </div>
      </Frame>
    );
  }

  if (step === "done" && result) {
    return (
      <Frame data={data} nowIso={nowIso}>
        <Done data={data} b={b} entryId={result.entryId} created={result.created} nowIso={nowIso} />
      </Frame>
    );
  }

  if (step === "review") {
    return (
      <Frame data={data} nowIso={nowIso}>
        <Review data={data} b={b} nowIso={nowIso} signedIn={signedIn} submitting={submitting} error={error} onBack={() => setStep("pick")} onSubmit={submit} />
      </Frame>
    );
  }

  const rawError = b.errors.find((e) => e.code !== "CAPTAIN_REQUIRED") ?? null;
  const firstError =
    rawError?.code === "INELIGIBLE_PLAYER" ? { ...rawError, message: "Replace your eliminated players (free)" } : rawError;
  const stillOut = data.ineligiblePrevious.filter((p) => b.playerIds.includes(p.id));
  const transferNote = b.transfers ? (
    <Notice tone={b.transfers.error ? "danger" : "lavender"} icon="swap">
      <span className="font-semibold text-ink">
        {b.transfers.discretionary.length} of {b.transfers.allowed} transfers used
      </span>
      <span className="text-ink-2"> · Replacing eliminated players is free.</span>
      {stillOut.length ? (
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-ink-2">Eliminated:</span>
          {stillOut.length > 1 ? (
            <button onClick={() => stillOut.forEach((p) => b.remove(p.id))} className="inline-flex h-7 items-center rounded-full bg-elevated px-2.5 text-caption font-semibold text-ink hover:bg-raised">
              Remove all {stillOut.length}
            </button>
          ) : null}
          {stillOut.map((p) => (
            <button
              key={p.id}
              onClick={() => b.remove(p.id)}
              aria-label={`Remove eliminated player ${p.nickname}`}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-negative-soft px-2.5 text-caption font-semibold text-negative hover:bg-negative/20"
            >
              {p.nickname} <Icon name="x" size={12} strokeWidth={2.6} />
            </button>
          ))}
        </span>
      ) : null}
    </Notice>
  ) : null;

  const list = (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-[#0d131d]" aria-label="Player pool">
      {b.visible.map((p) => (
        <PlayerRow
          key={p.id}
          p={p}
          team={data.teams[p.teamId]}
          opponent={opponentOf.get(p.id)}
          selected={b.playerIds.includes(p.id)}
          captain={b.captainId === p.id}
          block={b.blockReason(p)}
          metric={metric}
          onToggle={onToggle}
          onOpen={setOpenPlayer}
        />
      ))}
      {b.visible.length === 0 ? (
        <li className="px-4 py-10 text-center">
          <p className="text-headline text-ink">No players match</p>
          <p className="mt-1 text-callout text-ink-2">Try a different search or clear your filters.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => b.setFilters({ q: "", teams: [], roles: [], sort: b.filters.sort, affordable: false })}>
            Clear filters
          </Button>
        </li>
      ) : null}
    </ul>
  );

  const actionBar = (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        {b.playerIds.length < data.rules.rosterSize ? (
          <p className="text-footnote text-ink-2">
            Pick <span className="font-semibold text-ink">{data.rules.rosterSize - b.playerIds.length}</span> more · {money(b.summary.salaryRemaining)} left
          </p>
        ) : firstError ? (
          <p className="flex items-center gap-1.5 text-footnote text-negative">
            <Icon name="alert" size={14} /> {firstError.message}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-footnote text-accent">
            <Icon name="check" size={14} /> Team complete
          </p>
        )}
      </div>
      <Button size="lg" onClick={() => setStep("review")} disabled={!canReview} iconRight="chevronRight">
        Review team
      </Button>
    </div>
  );

  return (
    <Frame data={data} nowIso={nowIso} wide>
      {!online ? (
        <Notice tone="warning" icon="wifiOff" className="mb-3">
          You&apos;re offline. Keep building; your picks are saved on this device.
        </Notice>
      ) : null}
      {b.restored ? (
        <Notice tone="info" className="mb-3">
          <span className="text-ink">We restored your unsaved picks.</span>{" "}
          <button className="font-semibold text-accent" onClick={b.resetToSaved}>
            {data.saved ? "Discard and show saved team" : "Start over"}
          </button>
        </Notice>
      ) : null}

      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)_340px] lg:gap-6">
        {/* Desktop: filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
            <FilterPanel data={data} filters={b.filters} setFilters={b.setFilters} />
          </div>
        </aside>

        {/* Pool */}
        <section aria-label="Choose players" className="min-w-0">
          {/* Mobile roster tray: compact and sticky while searching */}
          <div className="glass sticky top-[57px] z-20 -mx-4 border-b border-border px-4 pt-3 pb-3 lg:hidden">
            <RosterTray data={data} b={b} onOpenPlayer={setOpenPlayer} />
          </div>
          <div className="space-y-3 pt-3 lg:pt-0">
            {transferNote}
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchField value={b.filters.q} onChange={(q) => b.setFilters({ ...b.filters, q })} />
              </div>
              <Button variant="secondary" icon="bolt" onClick={b.suggest} aria-label="Suggest a team" className="shrink-0">
                <span className="hidden sm:inline">Suggest</span>
              </Button>
            </div>
            <div className="lg:hidden">
              <FilterChips data={data} filters={b.filters} setFilters={b.setFilters} />
            </div>
            <div className="flex items-center justify-between px-1 text-caption text-ink-3">
              <span>
                {b.visible.length} of {data.pool.length} players
              </span>
              <span className="hidden sm:inline">Form = last 5 maps · avg = points per map</span>
            </div>
            {list}
          </div>
        </section>

        {/* Desktop: sticky roster */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-headline text-ink">Your roster</h2>
              {b.playerIds.length ? (
                <button onClick={b.clear} className="text-caption font-medium text-ink-3 hover:text-ink">
                  Clear
                </button>
              ) : null}
            </div>
            <RosterTray data={data} b={b} onOpenPlayer={setOpenPlayer} />
            <ul className="space-y-1.5">
              {b.playerIds.map((id) => {
                const p = b.byId.get(id);
                const out = b.ineligible.get(id);
                const team = data.teams[p?.teamId ?? out?.teamId ?? ""];
                const cap = id === b.captainId;
                return (
                  <li key={id} className="flex items-center gap-2.5 rounded-xl bg-elevated px-2.5 py-2">
                    <PlayerAvatar nickname={p?.nickname ?? out?.nickname ?? "?"} team={team} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-footnote font-semibold", out ? "text-negative" : "text-ink")}>{p?.nickname ?? out?.nickname}</div>
                      <div className="tabular text-caption text-ink-3">{out ? "Eliminated · replace free" : money(p?.price ?? 0)}</div>
                    </div>
                    {!out ? (
                      <IconButton icon="star" label={cap ? "Captain" : `Make ${p?.nickname} captain`} size={32} onClick={() => b.setCaptainId(id)} className={cn(cap && "bg-lavender-soft text-lavender hover:text-lavender")} aria-pressed={cap} />
                    ) : null}
                    <IconButton icon="x" label={`Remove ${p?.nickname ?? out?.nickname}`} size={32} onClick={() => b.remove(id)} />
                  </li>
                );
              })}
            </ul>
            {actionBar}
          </div>
        </aside>
      </div>

      {/* Mobile sticky action */}
      <div className="glass pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border px-4 pt-3 pb-3 lg:hidden">{actionBar}</div>

      <PlayerSheet
        playerId={openPlayer}
        contestId={data.contest.id}
        onClose={() => setOpenPlayer(null)}
        selected={!!openPlayer && b.playerIds.includes(openPlayer)}
        captain={!!openPlayer && b.captainId === openPlayer}
        block={openPlayer && b.byId.get(openPlayer) ? b.blockReason(b.byId.get(openPlayer)!) : null}
        canEdit={editable && !!openPlayer && (b.byId.has(openPlayer) || b.ineligible.has(openPlayer))}
        onToggle={onToggle}
        onCaptain={(id) => b.setCaptainId(id)}
      />
    </Frame>
  );
}

/** Builder chrome: back, event/contest/stage, lock countdown. No tab bar: this is a focused task. */
function Frame({ data, nowIso, children, wide }: { data: BuilderData; nowIso: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className={cn("mx-auto flex h-14 items-center gap-2 px-2 sm:px-4", wide ? "max-w-[1400px]" : "max-w-4xl")}>
          <Link href={`/t/${data.tournament.slug}/fantasy`} aria-label="Back to event" className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-elevated hover:text-ink">
            <Icon name="chevronLeft" size={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.9375rem] font-semibold text-ink">
              {data.tournament.shortName} <span className="font-normal text-ink-3">· {data.contest.name}</span>
            </div>
            <div className="truncate text-caption text-ink-2">{data.window ? `${data.window.stageName}${data.window.position > 1 ? " transfer window" : ""}` : "Lineup"}</div>
          </div>
          {data.tournament.isDemo ? <DemoBadge className="hidden sm:inline-flex" /> : null}
          {data.window && data.state === "open" ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-elevated px-3 text-footnote text-ink-2 ring-1 ring-border">
              <Icon name="lock" size={14} />
              <Countdown to={data.window.lockAt} now={nowIso} className="font-semibold text-ink" />
            </span>
          ) : data.state === "locked" ? (
            <StatePill kind="locked" />
          ) : null}
        </div>
      </header>
      <main id="main" className={cn("mx-auto px-4 pt-4 pb-32 lg:pt-6 lg:pb-12", wide ? "max-w-[1400px]" : "max-w-4xl")}>
        {children}
      </main>
    </div>
  );
}

function Done({ data, b, entryId, created, nowIso }: { data: BuilderData; b: ReturnType<typeof useBuilder>; entryId: string; created: boolean; nowIso: string }) {
  const toast = useToast();
  const share = async () => {
    const url = `${window.location.origin}/e/${entryId}`;
    const text = `My ${data.tournament.shortName} fantasy team is locked in.`;
    try {
      if (navigator.share) await navigator.share({ title: "My Lockin team", text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied", "success");
      }
    } catch {
      /* user cancelled */
    }
  };
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
        className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-accent text-accent-ink"
      >
        <Icon name="check" size={32} strokeWidth={2.6} />
      </motion.div>
      <h1 className="mt-5 text-display text-ink">{created ? "You're in" : "Changes saved"}</h1>
      <p className="mt-2 text-body text-ink-2">
        {data.contest.name} · {data.window?.stageName} locks in <Countdown to={data.window!.lockAt} now={nowIso} className="font-semibold text-ink" />. You can keep editing until then.
      </p>

      <div className="mt-7 rounded-[22px] border border-border bg-surface p-4 text-left">
        <div className="flex items-center justify-between">
          <div className="text-eyebrow text-ink-3">{data.tournament.shortName}</div>
          <div className="tabular text-caption text-ink-3">{money(b.summary.salaryUsed)} / {money(data.rules.salaryCap)}</div>
        </div>
        <ul className="mt-3 grid grid-cols-5 gap-2">
          <AnimatePresence>
            {b.playerIds.map((id, i) => {
              const p = b.byId.get(id);
              return (
                <motion.li key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className="flex min-w-0 flex-col items-center gap-1.5">
                  <PlayerAvatar nickname={p?.nickname ?? "?"} team={data.teams[p?.teamId ?? ""]} size={52} ring={id === b.captainId ? "captain" : null} />
                  <span className="w-full truncate text-center text-caption font-medium text-ink">{p?.nickname}</span>
                  <span className="text-[0.625rem] text-ink-3">{data.teams[p?.teamId ?? ""]?.acronym}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <ButtonLink href={`/e/${entryId}`} size="lg" iconRight="chevronRight">
          View my fantasy
        </ButtonLink>
        <ButtonLink href={`/leagues?contest=${data.contest.id}`} size="lg" variant="secondary" icon="trophy">
          Join or create a league
        </ButtonLink>
      </div>
      <Button variant="ghost" icon="share" className="mt-3" onClick={share}>
        Share your team
      </Button>
    </div>
  );
}
