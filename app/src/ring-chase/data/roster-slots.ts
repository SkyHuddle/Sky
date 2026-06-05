import type { RosterSlot } from '../core/types';
import { SLOT_ORDER } from '../core/constants';
import { getPlayerById } from './players';

/** Map four player ids to roster slots using primary roles */
export function assignRosterSlots(playerIds: string[]): Record<RosterSlot, string> {
  const ids = playerIds.filter(Boolean).slice(0, 4);
  if (ids.length < 4) {
    throw new Error(`Roster needs 4 players, got ${ids.length}: ${ids.join(', ')}`);
  }

  const slots: Partial<Record<RosterSlot, string>> = {};
  const used = new Set<string>();

  const claim = (slot: RosterSlot, id: string) => {
    if (used.has(id)) return false;
    slots[slot] = id;
    used.add(id);
    return true;
  };

  const matches = (id: string, pred: (primary: string, secondary: string) => boolean) => {
    const p = getPlayerById(id);
    if (!p) return false;
    return pred(p.primaryRole, p.secondaryRole);
  };

  for (const id of ids) {
    if (matches(id, (r) => r === 'mainAR')) {
      claim('mainAR', id);
      break;
    }
  }

  for (const id of ids) {
    if (used.has(id)) continue;
    if (matches(id, (r) => r === 'flex')) {
      claim('flex', id);
      break;
    }
  }

  for (const id of ids) {
    if (used.has(id)) continue;
    if (matches(id, (r) => r === 'smg')) {
      claim('smg', id);
      break;
    }
  }

  for (const id of ids) {
    if (used.has(id)) continue;
    if (matches(id, (r, s) => r === 'smg' || s === 'smg')) {
      claim('smg2', id);
      break;
    }
  }

  for (const slot of SLOT_ORDER) {
    if (slots[slot]) continue;
    const next = ids.find((id) => !used.has(id));
    if (next) claim(slot, next);
  }

  return slots as Record<RosterSlot, string>;
}

export function rosterPlayerIds(roster: Record<RosterSlot, string>): string[] {
  return SLOT_ORDER.map((slot) => roster[slot]);
}
