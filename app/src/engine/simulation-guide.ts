/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How Gol.gg OVR & the Golden Road work',
  intro:
    'Every player card shows an overall score (OVR) built from Gol.gg team-year stats — KDA, kill participation, damage share, gold share, win rate, and games played.',
  sections: [
    {
      title: 'What the number means',
      body: 'OVR blends all of a player’s Gol.gg stats for that team and year. KDA is shown smaller underneath. Higher OVR means stronger performance on that specific roster.',
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
