/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How OVR & the Golden Road work',
  intro:
    'Each card shows an overall rating (OVR) for that pro on that team and year — built from KDA, kill participation, damage share, gold share, win rate, and games played.',
  sections: [
    {
      title: 'What OVR means',
      body: 'Higher OVR means stronger performance on that specific roster that split. KDA is shown underneath as a quick reference, but OVR weighs every stat together.',
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
      body: 'Stacked high-OVR legends can still fail Worlds most of the time. Weak rolls and near-misses are the sweet spot.',
    },
  ],
} as const;
