/*
 * Which cards to show: every group that exists, then every suggested group
 * nobody has taken yet, then a couple of blank ones with the next numbers.
 * Take one and the next appears, so it never runs out.
 *
 * A suggestion is just a placeholder name on a free card. Whoever starts
 * the group can keep the name or write their own; the card is not active
 * until someone has joined it.
 */

import type { Table } from "./db";

/** Suggested names, by group number. Group 1 is the first, and so on. */
export const SUGGESTIONS = [
  "Handelsdagarna",
  "NU",
  "IdU",
  "Kårstyrelsen",
  "PU",
  "IntU",
  "ITU",
  "Längst fram till vänster i Aulan",
];

/** Blank cards to show after the suggestions. */
export const BLANK_CARDS = 2;

/** Big enough that no group is ever refused. */
export const GROUP_CAPACITY = 30;

export type Card = { slot: number; table: Table | null; suggestion: string | null };

export function suggestionFor(slot: number): string | null {
  return SUGGESTIONS[slot - 1] ?? null;
}

export function buildCards(tables: Table[]): Card[] {
  const used = new Set(tables.map((t) => t.slot));
  const taken: Card[] = [...tables]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => ({ slot: t.slot, table: t, suggestion: null }));

  const free: Card[] = [];
  let blanks = 0;
  for (let n = 1; blanks < BLANK_CARDS; n++) {
    if (used.has(n)) continue;
    const suggestion = suggestionFor(n);
    if (!suggestion) blanks++;
    free.push({ slot: n, table: null, suggestion });
  }
  return [...taken, ...free];
}
