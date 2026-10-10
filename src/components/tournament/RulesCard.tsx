import { CS2_RULE_SETS } from "@/domain/scoring/cs2";
import type { ContestRules } from "@/domain/types";
import { money } from "@/lib/format";

/** The scoring rules, rendered from the contest's pinned rule-set version (never hand-written). */
export function RulesCard({ ruleSetId, rules }: { ruleSetId: string; rules: ContestRules }) {
  const r = CS2_RULE_SETS[ruleSetId];
  if (!r) return null;
  const rows: [string, string][] = [
    ["Kill", `+${r.kill}`],
    ["Death", `${r.death}`],
    ["Assist", `+${r.assist}`],
    ["Opening kill (first kill of a round)", `+${r.openingKill}`],
    ["3-kill / 4-kill round / ace", `+${r.multiKill.k3} / +${r.multiKill.k4} / +${r.multiKill.k5}`],
    ["Clutch won 1v1 … 1v5", `+${r.clutch.v1} … +${r.clutch.v5}`],
    ["Map won (team)", `+${r.mapWin}`],
    ["Series won (team)", `+${r.seriesWin}`],
  ];
  return (
    <section aria-labelledby="rules-h" className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="rules-h" className="text-headline text-ink">
          Rules and scoring
        </h2>
        <span className="text-caption text-ink-3">Rule set {r.id}</span>
      </div>
      <ul className="mt-3 grid gap-2 text-callout text-ink-2 sm:grid-cols-2">
        <li>• {rules.rosterSize} players, {money(rules.salaryCap)} salary cap</li>
        <li>• At most {rules.maxPerTeam} players from one team</li>
        <li>• Captain scores {rules.captainMultiplier}×</li>
        <li>• {rules.transfersPerWindow} transfers per stage window; replacing eliminated players is free</li>
        <li>• Lineups lock when each stage&apos;s first match starts</li>
        <li>• Kept players stay at the price you paid; new signings cost the current price</li>
      </ul>
      <table className="mt-4 w-full text-footnote">
        <caption className="mb-2 text-left text-caption text-ink-3">Points per map</caption>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-border">
              <td className="py-2 text-ink-2">{k}</td>
              <td className="tabular py-2 text-right font-semibold text-ink">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 space-y-1.5 text-footnote text-ink-2">
        <p>
          <span className="font-semibold text-ink">Fair across formats.</span> A map over {r.overtimeCapRounds} rounds is scaled down to {r.overtimeCapRounds}. Map scores are averaged per series, so a 2-1 isn&apos;t worth more than a 2-0.
        </p>
        <p>
          <span className="font-semibold text-ink">Advancement credit.</span> Teams that clear a Swiss stage in fewer series earn {r.advancementCredit} points per player for each series they didn&apos;t need, so going 3-0 never scores less than going 3-2.
        </p>
        <p>
          <span className="font-semibold text-ink">Ties</span> are broken by captain points, then fewer transfers, then earlier submission. Never at random.
        </p>
      </div>
    </section>
  );
}
