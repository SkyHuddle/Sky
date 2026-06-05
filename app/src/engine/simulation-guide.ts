/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How ratings & the Golden Road work',
  intro:
    'The number on a player card is their Gol.gg stats on that team-year when we have them — KDA, kill share, damage, and gold share from that roster slice. Team and year on the spin match the real lineup.',
  sections: [
    {
      title: 'Are ratings real?',
      body: 'We scrape Gol.gg team pages for each historical roster in the game. When a player-team-year exists in our database, that OVR drives the sim. Otherwise we fall back to career Gol stats.',
    },
    {
      title: 'Respin',
      body: 'After the slot machine lands and you see the five players, you get one respin per game to roll a different team for the current round.',
    },
    {
      title: 'The four checks',
      body: 'Spring → MSI → Summer → Worlds. During the sim you will see bracket beats (groups, playoffs, finals). Those steps are driven by your roster power — not a replay of a real historical bracket.',
    },
    {
      title: 'What to expect',
      body: 'A stacked roster of high-OVR pros might have ~10% Golden Road odds. Mixed or weak rolls should fail most of the time. Near-misses at Worlds are the sweet spot.',
    },
  ],
} as const;
