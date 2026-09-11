"use client";

/*
 * The whole app on one page: a carousel of group cards, a panel for the
 * card in the middle, and the list of every group with its members.
 *
 * page.tsx reads the database address and key on the server and hands them
 * in as props, so the variable names never need a public prefix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

import { makeClient } from "@/lib/supabase";
import { createTable, describeError, joinTable, loadTables, renameTable, type Table } from "@/lib/db";
import { darken, slotColor } from "@/lib/colors";
import { buildCards, GROUP_CAPACITY, type Card } from "@/lib/groups";

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
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

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

  const cards = buildCards(tables);
  const activeIndex = Math.max(
    0,
    cards.findIndex((c) => c.slot === activeSlot)
  );
  const active: Card | undefined = cards[activeIndex];
  const seated = tables.reduce((n, t) => n + t.guests.length, 0);

  function goTo(slot: number) {
    const i = cards.findIndex((c) => c.slot === slot);
    if (i >= 0) swiper?.slideTo(i);
    setActiveSlot(slot);
    document.getElementById("panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="mx-auto max-w-xl pb-16 pt-6">
      <header className="px-4">
        <h1 className="text-3xl font-semibold tracking-tight">Vilka vill du sitta med?</h1>
        <p className="mt-1 text-neutral-600">
          Bläddra bland grupperna. Gå med i en, eller starta en egen på ett ledigt kort.
        </p>
      </header>

      <section className="mt-5" aria-label="Grupper">
        {loaded ? (
          <Swiper
            modules={[EffectCoverflow]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            slideToClickedSlide
            initialSlide={activeIndex}
            coverflowEffect={{ rotate: 0, stretch: -28, depth: 0, scale: 0.86, modifier: 1, slideShadows: false }}
            onSwiper={setSwiper}
            onSlideChange={(s) => setActiveSlot(cards[s.activeIndex]?.slot ?? null)}
            className="group-swiper"
          >
            {cards.map((c, i) => (
              <SwiperSlide key={c.slot} className="group-slide">
                {/* A tap on a card to the side brings it to the middle. */}
                <div className="h-full w-full" onClick={() => swiper?.slideTo(i)}>
                  <GroupCard card={c} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex justify-center py-16 text-neutral-500">Laddar…</div>
        )}
      </section>

      {loadError && (
        <p className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      )}

      {loaded && active && (
        <section id="panel" className="mx-4 mt-5 scroll-mt-4 rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
          {active.table ? (
            <JoinPanel key={active.table.id} db={db} table={active.table} onDone={refresh} />
          ) : (
            <CreatePanel key={active.slot} db={db} slot={active.slot} suggestion={active.suggestion} onDone={refresh} />
          )}
        </section>
      )}

      <section className="mt-8 px-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Alla grupper</h2>
          <span className="text-sm text-neutral-600">
            {loaded ? `${seated} anmälda` : "Laddar…"}
          </span>
        </div>

        {loaded && tables.length === 0 && (
          <p className="mt-3 text-neutral-600">
            Inga grupper ännu. Starta den första på ett ledigt kort.
          </p>
        )}

        <ul className="mt-3 space-y-3">
          {[...tables]
            .sort((a, b) => a.slot - b.slot)
            .map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => goTo(t.slot)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm active:bg-neutral-50"
                >
                  <span
                    className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full"
                    style={{ background: slotColor(t.slot) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate font-semibold">{t.name}</span>
                      <span className="shrink-0 text-sm text-neutral-600">{t.guests.length} st</span>
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

/* ---------- A card in the carousel ---------- */

function GroupCard({ card }: { card: Card }) {
  const { slot, table } = card;

  if (!table) {
    /* A placeholder: quiet, waiting to be taken. */
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-100/70 px-5 text-center text-neutral-500">
        <span className="text-xs uppercase tracking-widest">{card.suggestion ? `Förslag · Grupp ${slot}` : "Ledig"}</span>
        <span className="mt-1 text-2xl font-light leading-tight">{card.suggestion ?? `Grupp ${slot}`}</span>
        <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-neutral-300 text-2xl font-light">
          +
        </span>
        <span className="mt-3 text-sm">Starta gruppen här</span>
      </div>
    );
  }

  const color = slotColor(slot);
  const names = table.guests.map((g) => g.name);
  const shown = names.slice(0, 4);
  const more = names.length - shown.length;

  return (
    <div
      className="flex h-full w-full flex-col justify-between rounded-3xl p-5 text-white shadow-xl"
      style={{ background: `linear-gradient(160deg, ${color} 0%, ${darken(color)} 100%)` }}
    >
      <div>
        <span className="text-xs uppercase tracking-widest opacity-80">Grupp {slot}</span>
        <h3 className="mt-1 text-2xl font-bold leading-tight break-words">{table.name}</h3>
      </div>
      <div>
        <p className="text-sm leading-snug opacity-90">
          {shown.join(", ")}
          {more > 0 ? ` och ${more} till` : ""}
        </p>
        <p className="mt-3 text-3xl font-semibold">
          {names.length}
          <span className="ml-1 text-base font-normal opacity-80">{names.length === 1 ? "person" : "personer"}</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- Start a group on a free card ---------- */

function CreatePanel({
  db,
  slot,
  suggestion,
  onDone,
}: {
  db: SupabaseClient;
  slot: number;
  suggestion: string | null;
  onDone: () => Promise<void>;
}) {
  const [tableName, setTableName] = useState(suggestion ?? "");
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
        slot,
        name: tableName,
        creator,
        question,
        answer,
        capacity: GROUP_CAPACITY,
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
      <PanelHeader title={suggestion ? `Starta ${suggestion}` : `Starta grupp ${slot}`} color="#d4d4d8" />
      <p className="text-sm text-neutral-600">
        Du blir första medlem. Alla som vill vara med måste svara rätt på din fråga.
        {suggestion ? " Namnet är ett förslag, byt om du vill." : ""}
      </p>
      <Field label="Gruppens namn" value={tableName} onChange={setTableName} placeholder="t.ex. Gänget från Lund" />
      <Field label="Ditt namn" value={creator} onChange={setCreator} placeholder="För- och efternamn" />
      <Field label="Fråga" value={question} onChange={setQuestion} placeholder="t.ex. Vad heter vår katt?" />
      <Field label="Rätt svar" value={answer} onChange={setAnswer} placeholder="Svaret, t.ex. Misse" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Startar…" : "Starta gruppen"}
      </button>
    </form>
  );
}

/* ---------- Join a group that exists, or rename it ---------- */

function JoinPanel({
  db,
  table,
  onDone,
}: {
  db: SupabaseClient;
  table: Table;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"join" | "rename">("join");
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [newName, setNewName] = useState(table.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await joinTable(db, { tableId: table.id, name, answer });
      setNotice(`Klart, ${name.trim()} är nu med i ${table.name}.`);
      setName("");
      setAnswer("");
      await onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await renameTable(db, { tableId: table.id, answer, name: newName });
      setNotice(`Gruppen heter nu ${newName.trim()}.`);
      setAnswer("");
      setMode("join");
      await onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PanelHeader title={table.name} color={slotColor(table.slot)} />
      <p className="text-sm text-neutral-600">
        Grupp {table.slot} · {table.guests.length} {table.guests.length === 1 ? "person" : "personer"}
      </p>
      <ul className="flex flex-wrap gap-2">
        {table.guests.map((g) => (
          <li key={g.id} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">
            {g.name}
          </li>
        ))}
      </ul>

      {notice && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>
      )}

      {mode === "join" ? (
        <form onSubmit={submitJoin} className="space-y-3 border-t border-neutral-200 pt-3">
          <p className="font-medium">Vill du vara med? Svara på gruppens fråga.</p>
          <p className="rounded-xl bg-neutral-100 px-4 py-3">{table.question}</p>
          <Field label="Ditt svar" value={answer} onChange={setAnswer} />
          <Field label="Ditt namn" value={name} onChange={setName} placeholder="För- och efternamn" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Lägger till…" : "Gå med"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("rename");
              setError(null);
              setNotice(null);
            }}
            className="w-full py-2 text-sm text-neutral-600 underline-offset-2 hover:underline"
          >
            Byt namn på gruppen
          </button>
        </form>
      ) : (
        <form onSubmit={submitRename} className="space-y-3 border-t border-neutral-200 pt-3">
          <p className="font-medium">Byt namn. Bara den som kan svaret får göra det.</p>
          <p className="rounded-xl bg-neutral-100 px-4 py-3">{table.question}</p>
          <Field label="Svaret" value={answer} onChange={setAnswer} />
          <Field label="Nytt namn" value={newName} onChange={setNewName} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Sparar…" : "Spara namnet"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("join");
              setError(null);
            }}
            className="w-full py-2 text-sm text-neutral-600 underline-offset-2 hover:underline"
          >
            Avbryt
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------- Small shared pieces ---------- */

function PanelHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block h-5 w-5 shrink-0 rounded-full" style={{ background: color }} />
      <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h2>
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
