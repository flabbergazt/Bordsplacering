/*
 * The crowdfunding maths, kept apart from the screen so it is easy to read.
 *
 * Items are paid for in priority order. The money raised covers the first
 * items whole, then part of the next one, and the rest wait in line.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type FundingItem = {
  id: string;
  name: string;
  amount: number;
  priority: number;
};

export type Funding = {
  raised: number;
  expectedGuests: number;
  swish: string | null;
  message: string | null;
  items: FundingItem[];
};

export async function loadFunding(db: SupabaseClient): Promise<Funding | null> {
  const [row, items] = await Promise.all([
    db.from("funding").select("raised, expected_guests, swish, message").maybeSingle(),
    db.from("funding_items").select("id, name, amount, priority").order("priority").order("created_at"),
  ]);
  if (row.error) throw row.error;
  if (items.error) throw items.error;
  if (!row.data) return null;
  return {
    raised: row.data.raised,
    expectedGuests: row.data.expected_guests,
    swish: row.data.swish,
    message: row.data.message,
    items: items.data as FundingItem[],
  };
}

export type ItemStatus =
  | { kind: "covered" }
  | { kind: "next"; missing: number }
  | { kind: "waiting" };

export type Summary = {
  total: number;
  raised: number;
  /** 0..1 */
  share: number;
  missing: number;
  /** What each guest would need to give for everything, rounded up to 10 kr. */
  perGuest: number;
  statuses: { item: FundingItem; status: ItemStatus }[];
};

export function summarize(f: Funding): Summary {
  const total = f.items.reduce((n, i) => n + i.amount, 0);
  const raised = Math.max(0, f.raised);
  const missing = Math.max(0, total - raised);
  const guests = Math.max(1, f.expectedGuests);

  let left = raised;
  let nextSeen = false;
  const statuses = f.items.map((item) => {
    if (left >= item.amount) {
      left -= item.amount;
      return { item, status: { kind: "covered" } as ItemStatus };
    }
    if (!nextSeen) {
      nextSeen = true;
      const status: ItemStatus = { kind: "next", missing: item.amount - left };
      left = 0;
      return { item, status };
    }
    return { item, status: { kind: "waiting" } as ItemStatus };
  });

  return {
    total,
    raised,
    share: total > 0 ? Math.min(1, raised / total) : 0,
    missing,
    perGuest: Math.ceil(missing / guests / 10) * 10,
    statuses,
  };
}

export function kr(n: number): string {
  return `${n.toLocaleString("sv-SE")} kr`;
}
