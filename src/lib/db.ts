/*
 * Everything the app asks the database for, in one place.
 *
 * A "table" in the database is a group on screen; the name stuck from the
 * first version. Reads go straight to the tables. Writes go through the
 * functions in supabase/schema.sql, which are the only things allowed to
 * write.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Guest = {
  id: string;
  table_id: string;
  name: string;
  created_at: string;
};

export type Table = {
  id: string;
  slot: number;
  name: string;
  question: string;
  capacity: number;
  created_at: string;
  guests: Guest[];
};

/** All tables with their guests, oldest guest first. */
export async function loadTables(db: SupabaseClient): Promise<Table[]> {
  const [tables, guests] = await Promise.all([
    db.from("tables").select("id, slot, name, question, capacity, created_at").order("slot"),
    db.from("guests").select("id, table_id, name, created_at").order("created_at"),
  ]);
  if (tables.error) throw tables.error;
  if (guests.error) throw guests.error;

  const byTable = new Map<string, Guest[]>();
  for (const g of guests.data as Guest[]) {
    const list = byTable.get(g.table_id) ?? [];
    list.push(g);
    byTable.set(g.table_id, list);
  }
  return (tables.data as Omit<Table, "guests">[]).map((t) => ({
    ...t,
    guests: byTable.get(t.id) ?? [],
  }));
}

export async function createTable(db: SupabaseClient, input: {
  slot: number;
  name: string;
  creator: string;
  question: string;
  answer: string;
  capacity: number;
}): Promise<void> {
  const { error } = await db.rpc("create_table", {
    p_slot: input.slot,
    p_name: input.name,
    p_creator: input.creator,
    p_question: input.question,
    p_answer: input.answer,
    p_capacity: input.capacity,
  });
  if (error) throw new Error(error.message);
}

export async function joinTable(db: SupabaseClient, input: {
  tableId: string;
  name: string;
  answer: string;
}): Promise<void> {
  const { error } = await db.rpc("join_table", {
    p_table_id: input.tableId,
    p_name: input.name,
    p_answer: input.answer,
  });
  if (error) throw new Error(error.message);
}

/** Change a group's name. Needs the group's answer, so only members can. */
export async function renameTable(db: SupabaseClient, input: {
  tableId: string;
  answer: string;
  name: string;
}): Promise<void> {
  const { error } = await db.rpc("rename_table", {
    p_table_id: input.tableId,
    p_answer: input.answer,
    p_name: input.name,
  });
  if (error) throw new Error(error.message);
}

/** Remove one member. Needs the group's answer. */
export async function leaveTable(db: SupabaseClient, input: {
  tableId: string;
  guestId: string;
  answer: string;
}): Promise<void> {
  const { error } = await db.rpc("leave_table", {
    p_table_id: input.tableId,
    p_guest_id: input.guestId,
    p_answer: input.answer,
  });
  if (error) throw new Error(error.message);
}

/** The database answers with short codes; this is what people read. */
export function describeError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  const known: Record<string, string> = {
    wrong_answer: "Fel svar. Fråga någon som redan är med i gruppen.",
    already_seated: "Det namnet är redan med i den här gruppen.",
    table_full: "Gruppen är full.",
    slot_taken: "Någon hann före och tog den här gruppen. Välj en annan.",
    table_not_found: "Gruppen finns inte längre.",
    guest_not_found: "Det namnet finns inte längre i gruppen.",
    name_required: "Skriv ditt namn.",
    table_name_required: "Ge gruppen ett namn.",
    question_required: "Skriv en fråga.",
    answer_required: "Skriv rätt svar.",
  };
  return known[code] ?? `Något gick fel: ${code}`;
}
