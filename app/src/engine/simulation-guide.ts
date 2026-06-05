/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How Gol.gg KDA & the Golden Road work',
  intro:
    'Every player card shows their Gol.gg KDA average for that team and year — pulled from the team roster table when possible, otherwise the season split.',
  sections: [
    {
      title: 'What the number means',
      body: 'KDA is kills + assists per death from Gol.gg pro match data. Higher KDA on a card means that player was performing better on that specific roster during that year.',
    },
    {
      title: 'Respin',
      body: 'After the slot machine lands and you see the five players, you get one respin per game to roll a different team for the current round.',
    },
    {
      title: 'The four checks',
      body: 'Spring → MSI → Summer → Worlds. Your roster KDA is converted into sim power for each stage — not a replay of a real historical bracket.',
    },
    {
      title: 'What to expect',
      body: 'Stacked high-KDA legends can still fail Worlds most of the time. Weak rolls and near-misses are the sweet spot.',
    },
  ],
} as const;
