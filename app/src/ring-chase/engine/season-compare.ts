import type { DraftPick, HistoricalCodTeam, HistoricalComparison, SeasonSummary } from '../core/types';

function formatTeamFact(pick: DraftPick): HistoricalComparison['facts'][number] {
  const { team, player } = pick;
  return {
    teamLabel: `${team.teamName} ${team.season}`,
    playerTag: player.gamertag,
    placement: team.placement,
    majors: team.majorWins,
    champs: team.champsPlacement,
    ringThatYear: team.isChampsWinner,
  };
}

function anchorPick(picks: DraftPick[]): DraftPick {
  const champs = picks.filter((p) => p.team.isChampsWinner);
  if (champs.length > 0) {
    return champs.sort((a, b) => b.team.teamRating - a.team.teamRating)[0]!;
  }
  return [...picks].sort((a, b) => b.team.teamRating - a.team.teamRating)[0]!;
}

function teamHistoricalLine(team: HistoricalCodTeam): string {
  if (team.isChampsWinner) {
    return `${team.majorWins} major${team.majorWins === 1 ? '' : 's'} + Champs`;
  }
  if (team.majorWins > 0) {
    return `${team.majorWins} major${team.majorWins === 1 ? '' : 's'}, ${team.champsPlacement} at Champs`;
  }
  return `${team.placement}, ${team.champsPlacement} at Champs`;
}

export function buildHistoricalComparison(
  picks: DraftPick[],
  summary: SeasonSummary
): HistoricalComparison {
  const facts = picks.map(formatTeamFact);
  const anchor = anchorPick(picks);
  const anchorHist = teamHistoricalLine(anchor.team);

  let anchorLine: string;
  let contrastLine: string;

  const perfectSeason = summary.ringLine === 'Perfect Season';
  const ringWon = summary.ringLine === 'Ring' || perfectSeason;

  if (perfectSeason) {
    anchorLine = `You ran the table like ${anchor.team.teamName} ${anchor.team.season} — they went ${anchorHist}.`;
    contrastLine = 'Perfect season. That\'s the standard.';
  } else if (ringWon) {
    anchorLine = `Ring secured. ${anchor.team.teamName} ${anchor.team.season} actually went ${anchorHist}.`;
    contrastLine =
      anchor.team.isChampsWinner
        ? 'You matched a real Champs roster\'s ceiling.'
        : `You went further than ${anchor.team.teamName} ${anchor.team.season} did that year.`;
  } else if (summary.majorWins >= 3 && summary.champsLine === 'Lost Grand Final') {
    anchorLine = `16-4 vibes — ${summary.majorWins} majors, no ring. ${anchor.team.teamName} ${anchor.team.season} went ${anchorHist}.`;
    contrastLine =
      anchor.team.isChampsWinner
        ? `They closed Champs. You didn't.`
        : `You outpaced their major count — Champs was the gap.`;
  } else if (summary.majorWins > 0) {
    anchorLine = `You won ${summary.majorWins} major${summary.majorWins === 1 ? '' : 's'}. ${anchor.team.teamName} ${anchor.team.season}: ${anchorHist}.`;
    contrastLine =
      summary.majorWins >= anchor.team.majorWins
        ? `Your major count stacks up to that card.`
        : `Short of what ${anchor.team.teamName} ${anchor.team.season} won for real.`;
  } else {
    anchorLine = `Tough year. ${anchor.team.teamName} ${anchor.team.season} still went ${anchorHist}.`;
    contrastLine = 'The cards you drafted have more hardware than this run.';
  }

  return {
    yourHeadline: summary.headline,
    facts,
    anchorLine,
    contrastLine,
  };
}
