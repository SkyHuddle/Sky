/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How ratings & the Golden Road work',
  intro:
    'The number on a player card is their career strength — not a guess at how they played on that specific team-year. The spin picks which legendary roster you draft from; OVR comes from Gol.gg career stats when available.',
  sections: [
    {
      title: 'Are ratings real?',
      body: 'Most pros use Gol.gg career stats (win rate, KDA, damage, sample size). Others use curated peaks informed by titles and international play. We do not pretend to know exact stats for every team-year combo.',
    },
    {
      title: 'Team & year on the card',
      body: 'Spring 2016 SKT and 2020 CLG are different vibes for the draft — but Faker is still Faker. Team tier affects which rosters show up in the slot machine, not a hidden nerf on the player badge.',
    },
    {
      title: 'The four checks',
      body: 'Spring → MSI → Summer → Worlds. During the sim you will see bracket beats (groups, playoffs, finals). Those steps are driven by your roster power — not a replay of a real historical bracket.',
    },
    {
      title: 'What to expect',
      body: 'A stacked roster of high-OVR pros might have ~10% Golden Road odds. Mixed rolls should fail most of the time. Near-misses at Worlds are the sweet spot.',
    },
  ],
} as const;
