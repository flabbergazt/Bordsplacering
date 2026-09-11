"use client";

/*
 * The whole app on one page: the room, a panel for the table you tapped,
 * and the list of every table with its guests.
 *
 * page.tsx reads the database address and key on the server and hands them
 * in as props, so the variable names never need a public prefix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { useCallback, useEffect, useMemo, useState } from "react";
import { makeClient } from "@/lib/supabase";
import { createTable, describeError, joinTable, loadTables, type Table } from "@/lib/db";
import { ROOM, slotColor, textOn, type Slot } from "@/lib/room";

export default function App({
  url,
  anonKey,
}: {
  url: string | null;
  anonKey: string | null;
}) {
  const db = useMemo(() => (url && anonKey ? makeClient(url, anonKey) : null), [url, anonKey]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      setTables(await loadTables(db));
      setLoadError(null);
    } catch (err) {
      setLoadError(describeError(err));
    } finally {
      setLoaded(true);
    }
  }, [db]);

  /* Load once, and again whenever the phone comes back to the page, so a
     list that was open during dinner is not an hour stale. */
  useEffect(() => {
    (async () => {
      await refresh();
    })();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (!db) {
    const missing = [...(url ? [] : ["SUPABASE_URL"]), ...(anonKey ? [] : ["SUPABASE_ANON_KEY"])];
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Ingen databas konfigurerad</h1>
        <p className="mt-3 text-neutral-700">
          Appen saknar följande miljövariabler i Vercel. Lägg till dem under
          Settings → Environment Variables och gör en Redeploy.
        </p>
        <ul className="mt-3 list-disc pl-5 font-mono text-sm">
          {missing.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </main>
    );
  }

  const bySlot = new Map(tables.map((t) => [t.slot, t]));
  const slot = ROOM.slots.find((s) => s.slot === selectedSlot) ?? null;
  const selectedTable = slot ? bySlot.get(slot.slot) ?? null : null;
  const seated = tables.reduce((n, t) => n + t.guests.length, 0);

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Bordsplacering</h1>
        <p className="mt-1 text-neutral-600">
          Tryck på ett bord för att sätta dig, eller på ett ledigt för att starta ett eget.
        </p>
      </header>

      <section className="mt-5 overflow-hidden rounded-2xl border border-neutral-300 bg-[#dfe3ea] shadow-sm">
        <RoomMap tables={bySlot} selected={selectedSlot} onSelect={setSelectedSlot} />
      </section>

      {loadError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      )}

      {slot && (
        <section className="mt-5 rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
          {selectedTable ? (
            <JoinPanel
              db={db}
              table={selectedTable}
              onDone={async () => {
                await refresh();
              }}
              onClose={() => setSelectedSlot(null)}
            />
          ) : (
            <CreatePanel
              db={db}
              slot={slot}
              onDone={async () => {
                await refresh();
              }}
              onClose={() => setSelectedSlot(null)}
            />
          )}
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Alla bord</h2>
          <span className="text-sm text-neutral-600">
            {loaded ? `${seated} anmälda` : "Laddar…"}
          </span>
        </div>

        {loaded && tables.length === 0 && (
          <p className="mt-3 text-neutral-600">
            Inga bord ännu. Tryck på ett ledigt bord i rummet och starta det första.
          </p>
        )}

        <ul className="mt-3 space-y-3">
          {tables.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedSlot(t.slot)}
                className="flex w-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm active:bg-neutral-50"
              >
                <span
                  className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full"
                  style={{ background: slotColor(t.slot) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-semibold">
                      <span className="mr-2 text-sm font-medium text-neutral-500">Bord {t.slot}</span>
                      {t.name}
                    </span>
                    <span className="shrink-0 text-sm text-neutral-600">
                      {t.guests.length}/{t.capacity}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-neutral-700">
                    {t.guests.map((g) => g.name).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/* ---------- The drawing ---------- */

const INK = "#3a3a44";
const PLAN_FONT = "Georgia, 'Times New Roman', serif";

function RoomMap({
  tables,
  selected,
  onSelect,
}: {
  tables: Map<number, Table>;
  selected: number | null;
  onSelect: (slot: number) => void;
}) {
  const { image, stage, bar, entrance } = ROOM;
  return (
    <svg
      viewBox={`0 0 ${image.width} ${image.height}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Rummet med borden"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={INK} />
        </marker>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* The 1925 plan */}
      <image href={image.src} x={0} y={0} width={image.width} height={image.height} />

      {/* Stage */}
      <polygon points={stage.points} fill="rgba(58,58,68,0.10)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <PlanLabel x={stage.labelX} y={stage.labelY}>
        {stage.label}
      </PlanLabel>

      {/* Bar */}
      <polygon points={bar.points} fill="rgba(58,58,68,0.10)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <PlanLabel x={bar.labelX} y={bar.labelY} rotate={bar.rotate}>
        {bar.label}
      </PlanLabel>

      {/* Entrance */}
      <line
        x1={entrance.x}
        y1={entrance.y + 38}
        x2={entrance.x}
        y2={entrance.y - 30}
        stroke={INK}
        strokeWidth={4}
        markerEnd="url(#arrow)"
      />
      <PlanLabel x={entrance.x + 14} y={entrance.y + 24} anchor="start">
        {entrance.label}
      </PlanLabel>

      {/* Tables */}
      {ROOM.slots.map((s) => (
        <TableMark
          key={s.slot}
          slot={s}
          table={tables.get(s.slot)}
          selected={selected === s.slot}
          onSelect={() => onSelect(s.slot)}
        />
      ))}
    </svg>
  );
}

/* Lettering in the spirit of the plan: serif capitals, spaced out. */
function PlanLabel({
  x,
  y,
  rotate,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  rotate?: number;
  anchor?: "start" | "middle";
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={PLAN_FONT}
      fontSize={22}
      letterSpacing={3}
      fill={INK}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children.toUpperCase()}
    </text>
  );
}

/* One table with its eight chairs, drawn to scale. */
function TableMark({
  slot,
  table,
  selected,
  onSelect,
}: {
  slot: Slot;
  table: Table | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const { w, h } = ROOM.tableTop;
  const { r, gap } = ROOM.chair;
  const fill = table ? slotColor(slot.slot) : "#fbf8f2";
  const ink = table ? textOn(fill) : "#6b6b76";
  const chairFill = table ? fill : "#e6e0d6";
  const rotate = slot.orientation === "v" ? -90 : 0;

  /* Three chairs along each long side, one at each end. */
  const chairs: [number, number][] = [
    ...[-w / 3, 0, w / 3].flatMap((cx): [number, number][] => [
      [cx, -h / 2 - gap],
      [cx, h / 2 + gap],
    ]),
    [-w / 2 - gap, 0],
    [w / 2 + gap, 0],
  ];
  const hitW = w + 2 * (gap + r);
  const hitH = h + 2 * (gap + r);

  return (
    <g
      transform={`translate(${slot.x} ${slot.y}) rotate(${rotate})`}
      onClick={onSelect}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={table ? `${table.name}, ${table.guests.length} av ${table.capacity}` : `Ledigt bord ${slot.slot}`}
    >
      <rect x={-hitW / 2} y={-hitH / 2} width={hitW} height={hitH} fill="transparent" />
      {chairs.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={chairFill} stroke={table ? "#ffffff" : "#9a948a"} strokeWidth={1.5} opacity={table ? 0.9 : 1} />
      ))}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={4}
        fill={fill}
        stroke={selected ? "#1b1b1f" : "#ffffff"}
        strokeWidth={selected ? 4 : 2}
        strokeDasharray={table ? undefined : "5 4"}
        filter={table ? "url(#shadow)" : undefined}
      />
      {/* Just the number: to scale, a table is too small on a phone for a
          name. The list below says which number is which group. */}
      <text
        x={table ? -14 : 0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={22}
        fontWeight={700}
        fill={ink}
      >
        {slot.slot}
      </text>
      {table && (
        <text x={16} y={1} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill={ink} opacity={0.9}>
          {table.guests.length}/{table.capacity}
        </text>
      )}
    </g>
  );
}

/* ---------- Start a table on a free spot ---------- */

function CreatePanel({
  db,
  slot,
  onDone,
  onClose,
}: {
  db: SupabaseClient;
  slot: Slot;
  onDone: () => Promise<void>;
  onClose: () => void;
}) {
  const [tableName, setTableName] = useState("");
  const [creator, setCreator] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createTable(db, {
        slot: slot.slot,
        name: tableName,
        creator,
        question,
        answer,
        capacity: slot.capacity,
      });
      await onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <PanelHeader title={`Starta bord ${slot.slot}`} color={slotColor(slot.slot)} onClose={onClose} />
      <p className="text-sm text-neutral-600">
        Du sätter dig själv först. Alla som vill sitta här måste svara rätt på din fråga.
      </p>
      <Field label="Bordets namn" value={tableName} onChange={setTableName} placeholder="t.ex. Gänget från Lund" />
      <Field label="Ditt namn" value={creator} onChange={setCreator} placeholder="För- och efternamn" />
      <Field label="Fråga" value={question} onChange={setQuestion} placeholder="t.ex. Vad heter vår katt?" />
      <Field label="Rätt svar" value={answer} onChange={setAnswer} placeholder="Svaret, t.ex. Misse" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Startar…" : "Starta bordet"}
      </button>
    </form>
  );
}

/* ---------- Sit down at a table that exists ---------- */

function JoinPanel({
  db,
  table,
  onDone,
  onClose,
}: {
  db: SupabaseClient;
  table: Table;
  onDone: () => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  const full = table.guests.length >= table.capacity;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await joinTable(db, { tableId: table.id, name, answer });
      setJoined(name.trim());
      setName("");
      setAnswer("");
      await onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PanelHeader title={table.name} color={slotColor(table.slot)} onClose={onClose} />
      <p className="text-sm text-neutral-600">
        Bord {table.slot} · {table.guests.length} av {table.capacity} platser
      </p>
      <ul className="flex flex-wrap gap-2">
        {table.guests.map((g) => (
          <li key={g.id} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">
            {g.name}
          </li>
        ))}
      </ul>

      {joined && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Klart, {joined} sitter nu vid {table.name}.
        </p>
      )}

      {full ? (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm">Bordet är fullt.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3 border-t border-neutral-200 pt-3">
          <p className="font-medium">Vill du sitta här? Svara på bordets fråga.</p>
          <p className="rounded-xl bg-neutral-100 px-4 py-3">{table.question}</p>
          <Field label="Ditt svar" value={answer} onChange={setAnswer} />
          <Field label="Ditt namn" value={name} onChange={setName} placeholder="För- och efternamn" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Sätter dig…" : "Sätt mig här"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------- Small shared pieces ---------- */

function PanelHeader({ title, color, onClose }: { title: string; color: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block h-5 w-5 shrink-0 rounded-full" style={{ background: color }} />
      <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Stäng"
        className="rounded-full px-3 py-1 text-neutral-600 active:bg-neutral-100"
      >
        ✕
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        autoComplete="off"
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-base"
      />
    </label>
  );
}
