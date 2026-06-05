/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How ratings & the Golden Road work',
  intro:
    'The number on a player card is their strength on that team-year — not their career peak. CLG 2020 hits different than T1 2016.',
  sections: [
    {
      title: 'Are ratings real?',
      body: 'We hand-curve each pro from historical results (titles, peak years, international play). It is informed by esports history, not live match API data. Faker on a 2016 SKT card is elite; the same name on a weak year/team card gets scaled down automatically.',
    },
    {
      title: 'Card power vs peak OVR',
      body: 'Weak teams (CLG, Excel, Immortals), off-peak years, and LCS/LEC cards lose power — especially for MSI and Worlds. You might see 88 peak on a legend, but 71 effective on a bad roll.',
    },
    {
      title: 'The four checks',
      body: 'Spring → MSI → Summer → Worlds. During the sim you will see bracket beats (groups, playoffs, finals). Those steps are driven by your team power — not a replay of a real historical bracket.',
    },
    {
      title: 'What to expect',
      body: 'A perfect draft from great cards might have ~10% Golden Road odds. Mixed or weak rolls should fail most of the time. Near-misses at Worlds are the sweet spot.',
    },
  ],
} as const;
