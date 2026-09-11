/*
 * Everything the app asks the database for, in one place.
 *
 * Reads go straight to the tables. Writes go through the two functions in
 * supabase/schema.sql, which are the only things allowed to insert.
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

/** The database answers with short codes; this is what people read. */
export function describeError(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  const known: Record<string, string> = {
    wrong_answer: "Fel svar. Fråga någon som redan sitter vid bordet.",
    already_seated: "Det namnet sitter redan vid det här bordet.",
    table_full: "Bordet är fullt.",
    slot_taken: "Någon hann före och tog det här bordet. Välj ett annat.",
    table_not_found: "Bordet finns inte längre.",
    name_required: "Skriv ditt namn.",
    table_name_required: "Ge bordet ett namn.",
    question_required: "Skriv en fråga.",
    answer_required: "Skriv rätt svar.",
  };
  return known[code] ?? `Något gick fel: ${code}`;
}
