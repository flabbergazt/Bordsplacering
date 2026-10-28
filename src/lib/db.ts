/*
 * Everything the app asks the database for, in one place.
 *
 * A "table" in the database is a group on screen; the name stuck from the
 * first version. Reads go straight to the tables and a counting view.
 * Writes go through the functions in supabase/schema.sql, which are the
 * only things allowed to write. Member names never reach the browser.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Table = {
  id: string;
  slot: number;
  name: string;
  capacity: number;
  created_at: string;
  /** How many have joined. */
  members: number;
};

/** All groups with their member counts. */
export async function loadTables(db: SupabaseClient): Promise<Table[]> {
  const [tables, counts] = await Promise.all([
    db.from("tables").select("id, slot, name, capacity, created_at").order("slot"),
    db.from("group_counts").select("table_id, members"),
  ]);
  if (tables.error) throw tables.error;
  if (counts.error) throw counts.error;

  const members = new Map<string, number>();
  for (const c of counts.data as { table_id: string; members: number }[]) {
    members.set(c.table_id, c.members);
  }
  return (tables.data as Omit<Table, "members">[]).map((t) => ({
    ...t,
    members: members.get(t.id) ?? 0,
  }));
}

export async function createTable(db: SupabaseClient, input: {
  slot: number;
  name: string;
  creator: string;
  capacity: number;
}): Promise<void> {
  const { error } = await db.rpc("create_table", {
    p_slot: input.slot,
    p_name: input.name,
    p_creator: input.creator,
    p_capacity: input.capacity,
  });
  if (error) throw new Error(error.message);
}

export async function joinTable(db: SupabaseClient, input: {
  tableId: string;
  name: string;
}): Promise<void> {
  const { error } = await db.rpc("join_table", {
    p_table_id: input.tableId,
    p_name: input.name,
  });
  if (error) throw new Error(error.message);
}

/** Remove the member with this name from the group. */
export async function leaveTable(db: SupabaseClient, input: {
  tableId: string;
  name: string;
}): Promise<void> {
  const { error } = await db.rpc("leave_table", {
    p_table_id: input.tableId,
    p_name: input.name,
  });
  if (error) throw new Error(error.message);
}

/** The database answers with short codes; this is what people read. */
export function describeError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  const known: Record<string, string> = {
    already_seated: "Det namnet är redan med i den här gruppen.",
    table_full: "Gruppen är full.",
    slot_taken: "Någon hann före och tog den här gruppen. Välj en annan.",
    table_not_found: "Gruppen finns inte längre.",
    guest_not_found: "Det namnet finns inte i gruppen. Skriv det precis som när du anmälde dig.",
    name_required: "Skriv ditt namn.",
    table_name_required: "Ge gruppen ett namn.",
  };
  return known[code] ?? `Något gick fel: ${code}`;
}
