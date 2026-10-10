import pg from "pg";

/** Reads an invite code straight from the database (the test plays the role of a friend who shared it). */
export async function inviteCode(leagueId: string): Promise<string> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const r = await client.query<{ invite_code: string }>("select invite_code from leagues where id = $1", [leagueId]);
    if (!r.rows[0]) throw new Error(`league ${leagueId} not found`);
    return r.rows[0].invite_code;
  } finally {
    await client.end();
  }
}

/** Waits for the pipeline to mark a demo series live with an in-map snapshot, and returns its id. */
export async function liveMatchId(tournamentId: string, timeoutMs = 90_000): Promise<string> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      const r = await client.query<{ id: string }>(
        `select m.id from matches m join stages s on s.id = m.stage_id join live_maps l on l.match_id = m.id
         where m.status = 'live' and s.tournament_id = $1 order by m.scheduled_at limit 1`,
        [tournamentId],
      );
      if (r.rows[0]) return r.rows[0].id;
      await new Promise((res) => setTimeout(res, 1_000));
    }
    throw new Error("no live series appeared");
  } finally {
    await client.end();
  }
}
