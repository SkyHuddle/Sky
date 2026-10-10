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
