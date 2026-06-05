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
      body: 'Spring → MSI → Summer → Worlds. Each stage is a percentage roll based on your roster strength — stronger teams win more often, but any lineup can pull off an upset.',
    },
    {
      title: 'What to expect',
      body: 'Win chance on the ready screen is the combined odds of clearing all four stages. Even modest OVR rosters keep a real shot; stacking legends pushes you into the teens or higher.',
    },
  ],
} as const;
