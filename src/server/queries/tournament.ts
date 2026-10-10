import { and, asc, eq, inArray, ne } from "drizzle-orm";
import type { ContestRules } from "@/domain/types";
import type { Db } from "../db/connect";
import * as s from "../db/schema";
import { matchesForStages, teamsById, type MatchLite, type TeamLite } from "./common";

/** Read models for Home and the tournament hub. */

export interface StageView {
  id: string;
  name: string;
  kind: string;
  position: number;
  status: string;
  beginAt: string;
  endAt: string;
  teamCount: number;
}

export interface WindowView {
  id: string;
  position: number;
  stageId: string;
  stageName: string;
  status: string;
  lockAt: string;
}

export interface ContestView {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  kind: string;
  status: string;
  opensAt: string;
  entries: number;
  ruleSetId: string;
  rules: ContestRules;
  windows: WindowView[];
  /** The window currently accepting entries/changes, if any. */
  openWindow: WindowView | null;
  /** The next window that will open. */
  nextWindow: WindowView | null;
  myEntry: { id: string; rank: number | null; points: number; entriesCount: number } | null;
}

export interface TournamentSummary {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tier: string;
  location: string;
  beginAt: string;
  endAt: string;
  isDemo: boolean;
  status: "upcoming" | "live" | "completed";
  currentStage: StageView | null;
  stages: StageView[];
  contests: ContestView[];
}

export async function tournamentSummaries(db: Db, viewerId: string | null, opts: { slug?: string } = {}): Promise<TournamentSummary[]> {
  const ts = opts.slug
    ? await db.select().from(s.tournaments).where(eq(s.tournaments.slug, opts.slug))
    : await db.select().from(s.tournaments).orderBy(asc(s.tournaments.beginAt));
  if (ts.length === 0) return [];
  const tids = ts.map((t) => t.id);
  const stageRows = await db.select().from(s.stages).where(inArray(s.stages.tournamentId, tids)).orderBy(asc(s.stages.position));
  const stageTeamRows = stageRows.length ? await db.select().from(s.stageTeams).where(inArray(s.stageTeams.stageId, stageRows.map((x) => x.id))) : [];
  const contestRows = await db.select().from(s.contests).where(inArray(s.contests.tournamentId, tids));
  const windowRows = contestRows.length
    ? await db.select().from(s.contestWindows).where(inArray(s.contestWindows.contestId, contestRows.map((c) => c.id))).orderBy(asc(s.contestWindows.position))
    : [];
  const entryRows = contestRows.length
    ? await db.select({ id: s.entries.id, contestId: s.entries.contestId, userId: s.entries.userId, rank: s.entries.rank, points: s.entries.totalPoints }).from(s.entries).where(inArray(s.entries.contestId, contestRows.map((c) => c.id)))
    : [];

  return ts.map((t) => {
    const stages: StageView[] = stageRows
      .filter((x) => x.tournamentId === t.id)
      .map((x) => ({
        id: x.id,
        name: x.name,
        kind: x.kind,
        position: x.position,
        status: x.status,
        beginAt: x.beginAt.toISOString(),
        endAt: x.endAt.toISOString(),
        teamCount: stageTeamRows.filter((r) => r.stageId === x.id).length,
      }));
    const status: TournamentSummary["status"] = stages.every((x) => x.status === "completed")
      ? "completed"
      : stages.some((x) => x.status !== "upcoming")
        ? "live"
        : "upcoming";
    const currentStage = stages.find((x) => x.status === "live") ?? stages.find((x) => x.status === "upcoming") ?? stages[stages.length - 1] ?? null;
    const contests: ContestView[] = contestRows
      .filter((c) => c.tournamentId === t.id)
      .map((c) => {
        const windows: WindowView[] = windowRows
          .filter((w) => w.contestId === c.id)
          .map((w) => ({
            id: w.id,
            position: w.position,
            stageId: w.stageId,
            stageName: stages.find((x) => x.id === w.stageId)?.name ?? "",
            status: w.status,
            lockAt: w.lockAt.toISOString(),
          }));
        const es = entryRows.filter((e) => e.contestId === c.id);
        const mine = viewerId ? es.find((e) => e.userId === viewerId) : undefined;
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          kind: c.kind,
          status: c.status,
          opensAt: c.opensAt.toISOString(),
          entries: es.length,
          ruleSetId: c.ruleSetId,
          rules: c.rules as ContestRules,
          windows,
          openWindow: windows.find((w) => w.status === "open") ?? null,
          nextWindow: windows.find((w) => w.status === "upcoming") ?? null,
          myEntry: mine ? { id: mine.id, rank: mine.rank, points: mine.points, entriesCount: es.length } : null,
        };
      });
    contests.sort((a, b) => rankContest(a) - rankContest(b));
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      shortName: t.shortName,
      tier: t.tier,
      location: t.location,
      beginAt: t.beginAt.toISOString(),
      endAt: t.endAt.toISOString(),
      isDemo: t.isDemo,
      status,
      currentStage,
      stages,
      contests,
    };
  });
}

/** Open contests first; otherwise the Main Event leads. */
function rankContest(c: ContestView): number {
  return (c.openWindow ? 0 : 10) + (c.kind === "main_event" ? 0 : 1);
}

export interface StandingRow {
  teamId: string;
  seed: number;
  wins: number;
  losses: number;
  status: string;
  entering: boolean;
}

export interface TournamentHub {
  summary: TournamentSummary;
  teams: Record<string, TeamLite>;
  matches: MatchLite[];
  standings: Record<string, StandingRow[]>;
}

export async function tournamentHub(db: Db, slug: string, viewerId: string | null): Promise<TournamentHub | null> {
  const [summary] = await tournamentSummaries(db, viewerId, { slug });
  if (!summary) return null;
  const stageIds = summary.stages.map((x) => x.id);
  const matches = await matchesForStages(db, stageIds);
  const st = stageIds.length ? await db.select().from(s.stageTeams).where(inArray(s.stageTeams.stageId, stageIds)) : [];
  const teams = await teamsById(db, [...new Set(st.map((x) => x.teamId))]);
  const standings: Record<string, StandingRow[]> = {};
  for (const stage of summary.stages) {
    standings[stage.id] = st
      .filter((x) => x.stageId === stage.id)
      .map((x) => ({ teamId: x.teamId, seed: x.seed, wins: x.wins, losses: x.losses, status: x.status, entering: x.entering }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed);
  }
  return { summary, teams: Object.fromEntries(teams), matches, standings };
}

/** Entries for the viewer in contests that aren't finished, newest event first. */
export async function myActiveEntries(db: Db, viewerId: string) {
  const rows = await db
    .select({ entryId: s.entries.id, contestId: s.contests.id, contestStatus: s.contests.status, tournamentSlug: s.tournaments.slug })
    .from(s.entries)
    .innerJoin(s.contests, eq(s.contests.id, s.entries.contestId))
    .innerJoin(s.tournaments, eq(s.tournaments.id, s.contests.tournamentId))
    .where(and(eq(s.entries.userId, viewerId), ne(s.contests.status, "completed")));
  return rows;
}
