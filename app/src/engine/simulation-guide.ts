/** Player-facing explanation of Golden Road simulation logic */
export const SIMULATION_GUIDE = {
  headline: 'How the Golden Road is scored',
  intro:
    'After your draft, we run four checks — Spring, MSI, Summer, and Worlds. You must pass all four to complete the Golden Road.',
  sections: [
    {
      title: 'Team power',
      body: 'Each player has hidden ratings (overall, peak, international play, clutch, etc.). We combine your five picks into one team power score, with extra weight on the stats that matter for each stage.',
    },
    {
      title: 'The roll',
      body: 'Each stage adds a small random swing (bigger for low-clutch rosters). Your roll must beat a difficulty bar. Spring is easiest; Worlds is hardest.',
    },
    {
      title: 'Draft quality matters',
      body: 'Pulling from weak teams (CLG, Excel, etc.) slightly lowers your power. Stacking legends helps — but there is always variance. A god squad can still stumble at MSI.',
    },
    {
      title: 'What to expect',
      body: 'Most runs fail somewhere. Near-misses (lost Worlds finals) are common. A perfect Golden Road should feel rare — roughly a few percent of strong drafts, much less with weak cards.',
    },
  ],
} as const;
