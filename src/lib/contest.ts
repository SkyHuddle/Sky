import type { ContestView, TournamentSummary } from "@/server/queries/tournament";
import type { StateKind } from "@/components/ui/status";

/** What a contest card should say and do right now. One place, so every screen agrees. */
export interface ContestCta {
  state: StateKind;
  stateLabel: string;
  headline: string;
  deadline: { label: string; at: string } | null;
  primary: { label: string; href: string };
}

export function contestCta(c: ContestView, now: Date): ContestCta {
  const open = c.openWindow && new Date(c.openWindow.lockAt) > now ? c.openWindow : null;
  const entered = !!c.myEntry;
  const build = `/c/${c.id}/build`;
  const view = c.myEntry ? `/e/${c.myEntry.id}` : `/c/${c.id}/leaderboard`;

  if (c.status === "completed") {
    return { state: "completed", stateLabel: "Final", headline: "Final standings", deadline: null, primary: { label: entered ? "See your result" : "Final standings", href: view } };
  }
  if (open) {
    const first = open.position === 1;
    if (first) {
      return {
        state: "open",
        stateLabel: "Entries open",
        headline: entered ? "Your team is in. Edit until lock." : "Build your team",
        deadline: { label: "Locks in", at: open.lockAt },
        primary: entered ? { label: "Edit team", href: build } : { label: "Build your team", href: build },
      };
    }
    return {
      state: "window",
      stateLabel: `${open.stageName} window`,
      headline: entered ? "Transfer window open" : "Late entry open",
      deadline: { label: "Closes in", at: open.lockAt },
      primary: entered ? { label: "Make transfers", href: build } : { label: "Join late", href: build },
    };
  }
  if (c.status === "live") {
    const next = c.nextWindow;
    return {
      state: "live",
      stateLabel: "Live",
      headline: entered ? "Your team is playing" : "In progress",
      deadline: next ? { label: `${next.stageName} lineups lock in`, at: next.lockAt } : null,
      primary: { label: entered ? "Open your team" : "Standings", href: view },
    };
  }
  // Opening time has passed but the first window's teams aren't known yet (e.g. Main Event before Stage 3).
  const waitingForTeams = new Date(c.opensAt) <= now;
  const firstStage = c.windows[0]?.stageName ?? "the first stage";
  return {
    state: "upcoming",
    stateLabel: waitingForTeams ? `Opens when ${firstStage} is set` : "Upcoming",
    headline: waitingForTeams ? `Opens when the ${firstStage} teams are known` : "Entries open soon",
    deadline: waitingForTeams ? null : { label: "Entries open", at: c.opensAt },
    primary: { label: "Event details", href: "" },
  };
}

/** The contest a newcomer should be pointed at for an event. */
export function primaryContest(t: TournamentSummary, now: Date): ContestView | null {
  const open = t.contests.filter((c) => c.openWindow && new Date(c.openWindow.lockAt) > now);
  return (
    open.find((c) => c.kind === "main_event") ??
    open[0] ??
    t.contests.find((c) => c.myEntry && c.status !== "completed") ??
    t.contests.find((c) => c.kind === "main_event") ??
    t.contests[0] ??
    null
  );
}
