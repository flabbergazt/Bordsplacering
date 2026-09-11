"use client";

/*
 * The whole app on one page: the room, a panel for the table you tapped,
 * and the list of every table with its guests.
 */

import { useCallback, useEffect, useState } from "react";
import { isConfigured, missingEnv } from "@/lib/supabase";
import { createTable, describeError, joinTable, loadTables, type Table } from "@/lib/db";
import { ROOM, slotColor, textOn, type Slot } from "@/lib/room";

export default function Home() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isConfigured) return;
    try {
      setTables(await loadTables());
      setLoadError(null);
    } catch (err) {
      setLoadError(describeError(err));
    } finally {
      setLoaded(true);
    }
  }, []);

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

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Ingen databas konfigurerad</h1>
        <p className="mt-3 text-neutral-700">
          Appen saknar följande miljövariabler. De läses in när appen byggs, så
          lägg till dem och bygg om.
        </p>
        <ul className="mt-3 list-disc pl-5 font-mono text-sm">
          {missingEnv.map((name) => (
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

      <section className="mt-5 overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm">
        <RoomMap tables={bySlot} selected={selectedSlot} onSelect={setSelectedSlot} />
      </section>

      {loadError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      )}

      {slot && (
        <section className="mt-5 rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
          {selectedTable ? (
            <JoinPanel
              table={selectedTable}
              onDone={async () => {
                await refresh();
              }}
              onClose={() => setSelectedSlot(null)}
            />
          ) : (
            <CreatePanel
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
                    <span className="truncate font-semibold">{t.name}</span>
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

function RoomMap({
  tables,
  selected,
  onSelect,
}: {
  tables: Map<number, Table>;
  selected: number | null;
  onSelect: (slot: number) => void;
}) {
  const r = ROOM.tableRadius;
  return (
    <svg
      viewBox={`0 0 ${ROOM.width} ${ROOM.height}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Rummet med borden"
    >
      {/* Floor and walls */}
      <polygon points={ROOM.outline} fill="#f6efe4" stroke="#1b1b1f" strokeWidth={6} />

      {/* Stage, bar, entrance */}
      {ROOM.features.map((f) => (
        <g key={f.label}>
          <rect
            x={f.x}
            y={f.y}
            width={f.w}
            height={f.h}
            rx={8}
            fill="#e4dbcc"
            stroke="#7a7268"
            strokeWidth={3}
          />
          <text
            x={f.x + f.w / 2}
            y={f.y + f.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={f.w < 80 ? 22 : 26}
            fontWeight={600}
            fill="#5b544b"
            transform={f.w < f.h ? `rotate(-90 ${f.x + f.w / 2} ${f.y + f.h / 2})` : undefined}
          >
            {f.label}
          </text>
        </g>
      ))}

      {/* Tables */}
      {ROOM.slots.map((s) => {
        const t = tables.get(s.slot);
        const isSelected = selected === s.slot;
        const fill = t ? slotColor(s.slot) : "#ffffff";
        const ink = t ? textOn(fill) : "#8a8378";
        return (
          <g
            key={s.slot}
            onClick={() => onSelect(s.slot)}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={t ? `${t.name}, ${t.guests.length} av ${t.capacity}` : `Ledigt bord ${s.slot}`}
          >
            <circle
              cx={s.x}
              cy={s.y}
              r={r}
              fill={fill}
              stroke={isSelected ? "#1b1b1f" : t ? "rgba(0,0,0,0.25)" : "#b8b0a4"}
              strokeWidth={isSelected ? 8 : 3}
              strokeDasharray={t ? undefined : "10 8"}
            />
            <text
              x={s.x}
              y={s.y - 8}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={18}
              fontWeight={700}
              fill={ink}
            >
              {t ? shorten(t.name, 11) : "Ledigt"}
            </text>
            <text
              x={s.x}
              y={s.y + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={18}
              fill={ink}
              opacity={0.85}
            >
              {t ? `${t.guests.length}/${t.capacity}` : `Bord ${s.slot}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function shorten(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/* ---------- Start a table on a free spot ---------- */

function CreatePanel({
  slot,
  onDone,
  onClose,
}: {
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
      await createTable({
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
  table,
  onDone,
  onClose,
}: {
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
      await joinTable({ tableId: table.id, name, answer });
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
