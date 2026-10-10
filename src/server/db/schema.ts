import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Database schema. Four domains, kept in separate groups:
 *   identity · esports (provider-fed, read-mostly) · fantasy (ours) · community · operations
 * Ids are text (UUIDs or deterministic slugs) so demo data is stable across reseeds.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();

// ─── Identity ──────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    avatarHue: integer("avatar_hue").notNull().default(170),
    favoriteGame: text("favorite_game").notNull().default("cs2"),
    autopilotDefault: boolean("autopilot_default").notNull().default(true),
    isBot: boolean("is_bot").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("users_username_lower").on(sql`lower(${t.username})`),
    uniqueIndex("users_email_lower").on(sql`lower(${t.email})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token. The raw token only ever lives in the user's cookie. */
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    expiresAt: ts("expires_at").notNull(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

// ─── Esports (normalised provider data) ────────────────────────────────────────────────────

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
});

export const externalIds = pgTable(
  "external_ids",
  {
    provider: text("provider").notNull(),
    entityType: text("entity_type").notNull(),
    externalId: text("external_id").notNull(),
    internalId: text("internal_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.entityType, t.externalId] })],
);

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id),
  name: text("name").notNull(),
  acronym: text("acronym").notNull(),
  color: text("color").notNull(),
  country: text("country").notNull(),
});

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id),
  nickname: text("nickname").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nationality: text("nationality").notNull(),
  role: text("role").notNull(),
  isStandIn: boolean("is_stand_in").notNull().default(false),
  /** Licensed portrait URL. Null means "use the typographic avatar". */
  portraitUrl: text("portrait_url"),
});

export const playerTeamMemberships = pgTable(
  "player_team_memberships",
  {
    playerId: text("player_id").notNull().references(() => players.id),
    teamId: text("team_id").notNull().references(() => teams.id),
    validFrom: ts("valid_from").notNull(),
    validTo: ts("valid_to"),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.teamId, t.validFrom] })],
);

export const tournaments = pgTable("tournaments", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tier: text("tier").notNull(),
  location: text("location").notNull(),
  beginAt: ts("begin_at").notNull(),
  endAt: ts("end_at").notNull(),
  provider: text("provider").notNull(),
  isDemo: boolean("is_demo").notNull(),
  featured: boolean("featured").notNull().default(false),
});

export const stages = pgTable(
  "stages",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
    name: text("name").notNull(),
    kind: text("kind").notNull(), // swiss | single_elimination
    position: integer("position").notNull(),
    beginAt: ts("begin_at").notNull(),
    endAt: ts("end_at").notNull(),
    winsToAdvance: integer("wins_to_advance"),
    lossesToEliminate: integer("losses_to_eliminate"),
    status: text("status").notNull().default("upcoming"), // upcoming | live | completed
  },
  (t) => [uniqueIndex("stages_tournament_position").on(t.tournamentId, t.position)],
);

export const stageTeams = pgTable(
  "stage_teams",
  {
    stageId: text("stage_id").notNull().references(() => stages.id),
    teamId: text("team_id").notNull().references(() => teams.id),
    seed: integer("seed").notNull(),
    entering: boolean("entering").notNull(),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    status: text("status").notNull().default("alive"), // alive | advanced | eliminated
  },
  (t) => [primaryKey({ columns: [t.stageId, t.teamId] })],
);

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    stageId: text("stage_id").notNull().references(() => stages.id),
    round: integer("round").notNull(),
    slot: text("slot").notNull(),
    format: integer("format").notNull(),
    scheduledAt: ts("scheduled_at").notNull(),
    originalScheduledAt: ts("original_scheduled_at"),
    status: text("status").notNull(),
    teamAId: text("team_a_id").notNull().references(() => teams.id),
    teamBId: text("team_b_id").notNull().references(() => teams.id),
    winnerTeamId: text("winner_team_id").references(() => teams.id),
    payloadHash: text("payload_hash").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("matches_stage").on(t.stageId), index("matches_scheduled").on(t.scheduledAt)],
);

export const maps = pgTable(
  "maps",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull().references(() => matches.id),
    number: integer("number").notNull(),
    mapName: text("map_name").notNull(),
    roundsPlayed: integer("rounds_played").notNull(),
    roundsA: integer("rounds_a").notNull(),
    roundsB: integer("rounds_b").notNull(),
    winnerTeamId: text("winner_team_id").notNull().references(() => teams.id),
    finishedAt: ts("finished_at").notNull(),
    statsVersion: integer("stats_version").notNull(),
  },
  (t) => [uniqueIndex("maps_match_number").on(t.matchId, t.number)],
);

/** Versioned: a provider correction inserts a new version; old versions are kept. */
export const playerMapStats = pgTable(
  "player_map_stats",
  {
    mapId: text("map_id").notNull().references(() => maps.id),
    playerId: text("player_id").notNull().references(() => players.id),
    statsVersion: integer("stats_version").notNull(),
    teamId: text("team_id").notNull().references(() => teams.id),
    kills: integer("kills").notNull(),
    deaths: integer("deaths").notNull(),
    assists: integer("assists").notNull(),
    openingKills: integer("opening_kills").notNull(),
    k3: integer("k3").notNull(),
    k4: integer("k4").notNull(),
    k5: integer("k5").notNull(),
    c1: integer("c1").notNull(),
    c2: integer("c2").notNull(),
    c3: integer("c3").notNull(),
    c4: integer("c4").notNull(),
    c5: integer("c5").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.mapId, t.playerId, t.statsVersion] }), index("pms_player").on(t.playerId)],
);

// ─── Fantasy ───────────────────────────────────────────────────────────────────────────────

export const scoringRuleSets = pgTable("scoring_rule_sets", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id),
  config: jsonb("config").notNull(),
  createdAt: createdAt(),
});

export const contests = pgTable(
  "contests",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    kind: text("kind").notNull(), // main_event | full_run | standard
    ruleSetId: text("rule_set_id").notNull().references(() => scoringRuleSets.id),
    /** ContestRules (roster size, cap, team limit, captain multiplier, transfers per window). */
    rules: jsonb("rules").notNull(),
    status: text("status").notNull().default("upcoming"), // upcoming | open | live | settling | completed
    opensAt: ts("opens_at").notNull(),
    settledAt: ts("settled_at"),
  },
  (t) => [uniqueIndex("contests_tournament_slug").on(t.tournamentId, t.slug)],
);

export const contestWindows = pgTable(
  "contest_windows",
  {
    id: text("id").primaryKey(),
    contestId: text("contest_id").notNull().references(() => contests.id),
    stageId: text("stage_id").notNull().references(() => stages.id),
    position: integer("position").notNull(),
    lockAt: ts("lock_at").notNull(),
    status: text("status").notNull().default("upcoming"), // upcoming | open | locked | completed
    poolFrozenAt: ts("pool_frozen_at"),
    autopilotRanAt: ts("autopilot_ran_at"),
  },
  (t) => [uniqueIndex("windows_contest_position").on(t.contestId, t.position)],
);

export const playerPrices = pgTable(
  "player_prices",
  {
    contestId: text("contest_id").notNull().references(() => contests.id),
    playerId: text("player_id").notNull().references(() => players.id),
    price: integer("price").notNull(),
    avgPoints: doublePrecision("avg_points").notNull(),
    mapsSampled: integer("maps_sampled").notNull(),
    overriddenBy: text("overridden_by"),
  },
  (t) => [primaryKey({ columns: [t.contestId, t.playerId] })],
);

/** The eligible pool for a window, frozen when the window opens (auditable, deterministic). */
export const windowPool = pgTable(
  "window_pool",
  {
    windowId: text("window_id").notNull().references(() => contestWindows.id),
    playerId: text("player_id").notNull().references(() => players.id),
    teamId: text("team_id").notNull().references(() => teams.id),
    price: integer("price").notNull(),
  },
  (t) => [primaryKey({ columns: [t.windowId, t.playerId] })],
);

export const entries = pgTable(
  "entries",
  {
    id: text("id").primaryKey(),
    contestId: text("contest_id").notNull().references(() => contests.id),
    userId: text("user_id").notNull().references(() => users.id),
    autopilot: boolean("autopilot").notNull().default(true),
    joinedWindowPosition: integer("joined_window_position").notNull(),
    submittedAt: ts("submitted_at").notNull(),
    totalPoints: doublePrecision("total_points").notNull().default(0),
    captainPoints: doublePrecision("captain_points").notNull().default(0),
    transfersUsed: integer("transfers_used").notNull().default(0),
    rank: integer("rank"),
    previousRank: integer("previous_rank"),
    scoreState: text("score_state").notNull().default("provisional"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("entries_contest_user").on(t.contestId, t.userId),
    index("entries_contest_rank").on(t.contestId, t.rank),
  ],
);

/** Every saved roster is a new version; the highest version for a window is the current one. */
export const rosterVersions = pgTable(
  "roster_versions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    windowId: text("window_id").notNull().references(() => contestWindows.id),
    version: integer("version").notNull(),
    captainPlayerId: text("captain_player_id").references(() => players.id),
    source: text("source").notNull(), // user | autopilot | carry_forward
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("roster_versions_entry_window_version").on(t.entryId, t.windowId, t.version)],
);

export const rosterSelections = pgTable(
  "roster_selections",
  {
    rosterVersionId: text("roster_version_id").notNull().references(() => rosterVersions.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull().references(() => players.id),
    slot: integer("slot").notNull(),
    /** Price paid. Kept players stay at their purchase price in later windows (FPL-style). */
    price: integer("price").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.rosterVersionId, t.playerId] })],
);

/** Net transfers for a window relative to the previous window's locked roster. */
export const transfers = pgTable(
  "transfers",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    windowId: text("window_id").notNull().references(() => contestWindows.id),
    outPlayerId: text("out_player_id").references(() => players.id),
    inPlayerId: text("in_player_id").references(() => players.id),
    kind: text("kind").notNull(), // free | discretionary | autopilot
    reason: text("reason").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("transfers_entry_window").on(t.entryId, t.windowId)],
);

/**
 * The scoring ledger. Append-only: a changed input (corrected stats or a new rule set) inserts a
 * new row and marks the old one superseded. Rows with the same input hash are never duplicated,
 * so re-ingesting the same map can't double-count.
 */
export const scoringEvents = pgTable(
  "scoring_events",
  {
    id: text("id").primaryKey(),
    ruleSetId: text("rule_set_id").notNull().references(() => scoringRuleSets.id),
    stageId: text("stage_id").notNull().references(() => stages.id),
    matchId: text("match_id").references(() => matches.id),
    playerId: text("player_id").notNull().references(() => players.id),
    teamId: text("team_id").notNull().references(() => teams.id),
    kind: text("kind").notNull(), // series | advancement_credit
    points: doublePrecision("points").notNull(),
    breakdown: jsonb("breakdown").notNull(),
    inputHash: text("input_hash").notNull(),
    state: text("state").notNull(), // provisional | official | settled
    supersededById: text("superseded_by_id"),
    supersededAt: ts("superseded_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("scoring_events_stage_player").on(t.stageId, t.playerId),
    index("scoring_events_match").on(t.matchId),
    uniqueIndex("scoring_events_current")
      .on(t.ruleSetId, t.kind, t.stageId, sql`coalesce(${t.matchId}, '')`, t.playerId)
      .where(sql`${t.supersededById} is null`),
  ],
);

export const entryWindowScores = pgTable(
  "entry_window_scores",
  {
    entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    windowId: text("window_id").notNull().references(() => contestWindows.id),
    points: doublePrecision("points").notNull(),
    captainPoints: doublePrecision("captain_points").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.windowId] })],
);

/** Rank history, written after each scoring batch (drives "movement" and final results). */
export const standingsSnapshots = pgTable(
  "standings_snapshots",
  {
    contestId: text("contest_id").notNull().references(() => contests.id),
    batchId: text("batch_id").notNull(),
    entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    points: doublePrecision("points").notNull(),
    entriesCount: integer("entries_count").notNull(),
    isFinal: boolean("is_final").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.contestId, t.batchId, t.entryId] })],
);

// ─── Community ─────────────────────────────────────────────────────────────────────────────

export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(),
  contestId: text("contest_id").notNull().references(() => contests.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  privacy: text("privacy").notNull().default("private"), // private | public
  inviteCode: text("invite_code").notNull().unique(),
  inviteExpiresAt: ts("invite_expires_at"),
  createdAt: createdAt(),
});

export const leagueMembers = pgTable(
  "league_members",
  {
    leagueId: text("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | member
    joinedAt: ts("joined_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.leagueId, t.userId] })],
);

/** One entry, many leaderboards: associates an existing entry with a league. */
export const leagueEntries = pgTable(
  "league_entries",
  {
    leagueId: text("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
    entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    addedAt: ts("added_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.leagueId, t.entryId] })],
);

// ─── Operations ────────────────────────────────────────────────────────────────────────────

export const providerRecords = pgTable(
  "provider_records",
  {
    provider: text("provider").notNull(),
    entityType: text("entity_type").notNull(),
    externalId: text("external_id").notNull(),
    payloadHash: text("payload_hash").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: ts("fetched_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.entityType, t.externalId, t.payloadHash] })],
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  startedAt: ts("started_at").notNull(),
  finishedAt: ts("finished_at"),
  status: text("status").notNull(), // running | succeeded | failed
  summary: jsonb("summary"),
  error: text("error"),
});

export const scoreCorrections = pgTable("score_corrections", {
  id: text("id").primaryKey(),
  mapId: text("map_id").notNull().references(() => maps.id),
  fromVersion: integer("from_version").notNull(),
  toVersion: integer("to_version").notNull(),
  changes: jsonb("changes").notNull(),
  detectedAt: createdAt(),
});

export const adminAuditLog = pgTable("admin_audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(), // user id or "system"
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: createdAt(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
