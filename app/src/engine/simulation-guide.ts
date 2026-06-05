/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How OVR & the Golden Road work',
  intro:
    'Each card shows an overall rating (OVR) for that pro on that team and year — built from split stats plus what the team actually achieved that season (Worlds, MSI, etc.).',
  sections: [
    {
      title: 'What OVR means',
      body: 'OVR blends KDA, KP%, damage share, win rate, and games played — then adjusts for team results. World Champions have a rating floor so every starter reflects a title-winning roster.',
    },
    {
      title: 'Exact vs estimated',
      body: 'Most cards use full roster stats. A few show ~ when we only have split-wide data — those ratings are directionally right but less precise.',
    },
    {
      title: 'Respin',
      body: 'After the slot machine lands and you see the five players, you get one respin per game to roll a different team for the current round.',
    },
    {
      title: 'The four checks',
      body: 'Spring → MSI → Summer → Worlds. Your roster OVR drives sim power at each stage — not a replay of a real historical bracket.',
    },
    {
      title: 'What to expect',
      body: 'Strong rosters win more often, but upsets still happen — that\'s what makes a Golden Road special. Stack high OVR picks and chase the ~10–25% runs.',
    },
  ],
} as const;
