"use client";

import { useEffect, useState } from "react";

/**
 * The other person's side of a record sent from Krovvi: what was agreed,
 * and two answers, "This is right" or "Something is off", where each line
 * becomes editable in place. The owner hears the answer in the app, and this
 * page shows what they did with each change. Only these lines ever reach
 * this page, never the recording.
 */

const API = process.env.NEXT_PUBLIC_RECORD_API ?? "https://eybepawprfhrvcnpggwk.supabase.co/functions/v1/record";

type Line = {
  id: string;
  kind: "agreed" | "task";
  side: "me" | "them" | "both";
  who: string | null;
  text: string;
  due_at: number | null;
};

type Fix = { line: string; text: string; decision?: "used" | "kept" };

type Reply = {
  status: "confirmed" | "fixed";
  name: string | null;
  note: string | null;
  fixes: Fix[];
  at: number;
};

type Shared = {
  owner: string;
  to: string | null;
  title: string | null;
  said_at: number;
  lang: string | null;
  /** The owner's zone: every day on this page is a day on their calendar. */
  zone: string | null;
  lines: Line[];
  reply: Reply | null;
};

type Phase = { kind: "loading" } | { kind: "gone" } | { kind: "expired" } | { kind: "error" } | { kind: "ready"; record: Shared };

const WEEKDAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"],
};
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WORDS = {
  en: {
    shared: (owner: string) => `${owner} shared what you agreed`,
    you: "You",
    by: (day: string) => `by ${day}`,
    right: "This is right",
    off: "Something is off",
    fixHint: "Change the lines that are wrong. Anything else goes in the note.",
    lineLabel: (n: number) => `Line ${n}`,
    note: "Anything else? (optional)",
    name: "Your name",
    send: "Send",
    cancel: "Cancel",
    sending: "Sending…",
    confirmedDone: (owner: string) => `Thanks. ${owner} will see that you confirmed it.`,
    fixedDone: (owner: string) => `Sent. ${owner} will see your changes.`,
    already: (day: string) => `You confirmed this on ${day}.`,
    alreadyFixed: (day: string) => `You sent changes on ${day}.`,
    yourChange: "Your change",
    yourNote: "Your note",
    used: (owner: string) => `${owner} used your change.`,
    kept: (owner: string) => `${owner} kept the first version.`,
    change: "Change your answer",
    empty: "Change at least one line, or write a note.",
    gone: "This link does not work. Ask the person who sent it for a new one.",
    expired: "This link has expired. Ask the person who sent it for a new one.",
    error: "Something went wrong. Try again in a moment.",
    retry: "Try again",
    about: "Krovvi keeps track of what was said in your conversations, so nothing agreed gets lost.",
    get: "Get Krovvi",
    only: "Only these lines were shared, never the conversation itself.",
  },
  ar: {
    shared: (owner: string) => `${owner} بعتلك اللي اتفقتوا عليه`,
    you: "إنت",
    by: (day: string) => `قبل ${day}`,
    right: "كده مظبوط",
    off: "في حاجة مش مظبوطة",
    fixHint: "غيّر السطور اللي مش مظبوطة. أي حاجة تانية اكتبها في الملاحظة.",
    lineLabel: (n: number) => `سطر ${n}`,
    note: "حاجة تانية؟ (اختياري)",
    name: "اسمك",
    send: "ابعت",
    cancel: "إلغاء",
    sending: "بيتبعت…",
    confirmedDone: (owner: string) => `شكرًا. ${owner} هيعرف إنك أكدت.`,
    fixedDone: (owner: string) => `اتبعت. ${owner} هيشوف تعديلاتك.`,
    already: (day: string) => `إنت أكدت ده يوم ${day}.`,
    alreadyFixed: (day: string) => `إنت بعت تعديلات يوم ${day}.`,
    yourChange: "تعديلك",
    yourNote: "ملاحظتك",
    used: (owner: string) => `${owner} خد تعديلك.`,
    kept: (owner: string) => `${owner} ساب النسخة الأولى.`,
    change: "غيّر ردك",
    empty: "غيّر سطر واحد على الأقل، أو اكتب ملاحظة.",
    gone: "اللينك ده مش شغال. اطلب لينك جديد من اللي بعته.",
    expired: "اللينك ده خلص. اطلب لينك جديد من اللي بعته.",
    error: "حصلت مشكلة. جرّب تاني كمان شوية.",
    retry: "جرّب تاني",
    about: "Krovvi بيفتكر اللي اتقال في كلامك مع الناس، عشان محدش ينسى اللي اتفقتوا عليه.",
    get: "نزّل Krovvi",
    only: "السطور دي بس اللي اتبعتت، الكلام نفسه لأ.",
  },
} as const;

type Lang = keyof typeof WORDS;

function first(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Weekday, day and month on the owner's calendar; the reader's own clock only if the zone is unknown. */
function calendar(ms: number, zone: string | null): { weekday: number; day: number; month: number } {
  const d = new Date(ms);
  if (zone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", day: "numeric", month: "numeric" }).formatToParts(d);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
      const weekday = SHORT_DAYS.indexOf(get("weekday"));
      const day = Number(get("day"));
      const month = Number(get("month")) - 1;
      if (weekday >= 0 && day > 0 && month >= 0) return { weekday, day, month };
    } catch {
      // An unknown zone: the reader's clock below.
    }
  }
  return { weekday: d.getDay(), day: d.getDate(), month: d.getMonth() };
}

function dayName(ms: number, lang: Lang, zone: string | null): string {
  const c = calendar(ms, zone);
  return lang === "ar" ? `${WEEKDAYS.ar[c.weekday]} ${c.day} ${MONTHS.ar[c.month]}` : `${WEEKDAYS.en[c.weekday]}, ${MONTHS.en[c.month]} ${c.day}`;
}

function langOf(record: Shared): Lang {
  if (record.lang) return record.lang.toLowerCase().startsWith("ar") ? "ar" : "en";
  const text = record.lines.map((l) => l.text).join(" ");
  return (text.match(/[؀-ۿ]/g) ?? []).length > (text.match(/[A-Za-z]/g) ?? []).length ? "ar" : "en";
}

/** Whose line it is, from the reader's side: "You" when it is theirs. */
function whose(line: Line, record: Shared, lang: Lang): string | null {
  if (line.kind === "agreed" || line.side === "both") return null;
  if (line.side === "me") return first(record.owner);
  const who = first(line.who);
  if (record.to && who && who.toLowerCase() === first(record.to).toLowerCase()) return WORDS[lang].you;
  return who || null;
}

/** Each line's words as the reader last left them: their earlier change, or the line itself. */
function draftsOf(record: Shared): { [id: string]: string } {
  const earlier = new Map((record.reply?.fixes ?? []).map((f) => [f.line, f.text]));
  return Object.fromEntries(record.lines.map((l) => [l.id, earlier.get(l.id) ?? l.text]));
}

/** A text box that grows with its words, so a line never scrolls inside itself. */
function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function RecordPage({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [mode, setMode] = useState<"view" | "fix" | "done">("view");
  const [busy, setBusy] = useState<"confirm" | "fix" | null>(null);
  const [changing, setChanging] = useState(false);
  const [drafts, setDrafts] = useState<{ [id: string]: string }>({});
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState<"confirmed" | "fixed" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = () => {
    setPhase({ kind: "loading" });
    fetch(`${API}?t=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as ({ ok?: boolean; gone?: boolean; expired?: boolean } & Partial<Shared>) | null;
        if (body?.ok && Array.isArray(body.lines)) {
          const record = { ...body, zone: body.zone ?? null } as Shared;
          setPhase({ kind: "ready", record });
          setName(record.reply?.name ?? first(record.to));
          return;
        }
        setPhase({ kind: body?.expired ? "expired" : body?.gone || res.status === 404 ? "gone" : "error" });
      })
      .catch(() => setPhase({ kind: "error" }));
  };

  useEffect(load, [token]);

  const record = phase.kind === "ready" ? phase.record : null;
  const lang: Lang = record ? langOf(record) : "en";
  const w = WORDS[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const ownerFirst = record ? first(record.owner) : "";
  const zone = record?.zone ?? null;
  const fixing = mode === "fix";
  // The answer on file, with "Change your answer", until the reader changes it or sends a new one.
  const earlier = record?.reply && !sent && !changing ? record.reply : null;
  // Their changes stay under their lines whenever they are not editing, the one just sent included.
  const shown = !fixing && record?.reply?.status === "fixed" && (!changing || sent) ? record.reply : null;
  const fixOf = (id: string) => shown?.fixes.find((f) => f.line === id);

  const startFix = () => {
    if (!record) return;
    setDrafts(draftsOf(record));
    setNote(record.reply?.note ?? "");
    setProblem(null);
    setChanging(true);
    setMode("fix");
  };

  const answer = async (action: "confirm" | "fix") => {
    if (!record || busy) return;
    const fixes =
      action === "fix"
        ? record.lines
            .map((l) => ({ line: l.id, text: (drafts[l.id] ?? "").trim() }))
            .filter((f) => f.text && f.text !== record.lines.find((l) => l.id === f.line)?.text.trim())
        : [];
    if (action === "fix" && !fixes.length && !note.trim()) {
      setProblem(w.empty);
      return;
    }
    setProblem(null);
    setBusy(action);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ t: token, action, name: name.trim() || null, note: action === "fix" ? note.trim() || null : null, fixes }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!body?.ok) throw new Error("not ok");
      // What was just sent is the answer on file now, as a reload would show it.
      const reply: Reply = { status: action === "confirm" ? "confirmed" : "fixed", name: name.trim() || null, note: action === "fix" ? note.trim() || null : null, fixes, at: Date.now() };
      setPhase({ kind: "ready", record: { ...record, reply } });
      setSent(reply.status);
      setMode("done");
    } catch {
      setProblem(w.error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main dir={dir} className="min-h-[100svh] px-5 pb-16 pt-10 sm:pt-16">
      <div className="mx-auto max-w-[560px]">
        <a href="/" className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)] no-underline">
          Krovvi
        </a>

        {phase.kind === "loading" ? (
          <div className="mt-16 flex justify-center" aria-live="polite">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--muted)]" />
          </div>
        ) : null}

        {phase.kind === "gone" || phase.kind === "expired" || phase.kind === "error" ? (
          <div className="mt-12">
            <p className="text-[17px] leading-[1.6] text-[var(--soft)]">{phase.kind === "gone" ? w.gone : phase.kind === "expired" ? w.expired : w.error}</p>
            {phase.kind === "error" ? (
              <button onClick={load} className="mt-6 h-11 rounded-full bg-[var(--surface-hi)] px-5 text-[15px] font-medium text-[var(--fg)]">
                {w.retry}
              </button>
            ) : null}
          </div>
        ) : null}

        {record ? (
          <>
            <h1 className="mt-10 text-[27px] font-semibold leading-[1.25] tracking-[-0.02em]">{w.shared(ownerFirst)}</h1>
            <p className="mt-2 text-[15px] text-[var(--muted)]">{[record.title, dayName(record.said_at, lang, zone)].filter(Boolean).join(" · ")}</p>

            {fixing ? <p className="mt-7 text-[15px] leading-[1.5] text-[var(--soft)]">{w.fixHint}</p> : null}

            <ul className={`${fixing ? "mt-4" : "mt-7"} overflow-hidden rounded-[18px] bg-[var(--surface)]`}>
              {record.lines.map((line, i) => {
                const who = whose(line, record, lang);
                const mine = fixOf(line.id);
                return (
                  <li key={line.id} className={i ? "border-t border-[var(--line)]" : ""}>
                    <div className="flex items-start gap-3 px-4 py-[14px]">
                      {fixing ? null : <span aria-hidden className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--soft)]" />}
                      <div className="min-w-0 flex-1">
                        {fixing ? (
                          <>
                            {who ? <p className="mb-1 text-[13px] font-semibold text-[var(--soft)]">{who}</p> : null}
                            <textarea
                              ref={grow}
                              value={drafts[line.id] ?? line.text}
                              onChange={(e) => {
                                grow(e.currentTarget);
                                const text = e.currentTarget.value;
                                setDrafts((was) => ({ ...was, [line.id]: text }));
                                setProblem(null);
                              }}
                              placeholder={line.text}
                              aria-label={w.lineLabel(i + 1)}
                              maxLength={300}
                              rows={1}
                              disabled={busy !== null}
                              className={`block w-full resize-none overflow-hidden rounded-[10px] bg-[var(--surface-hi)] px-3 py-2 text-[16px] leading-[1.5] text-[var(--fg)] outline-none placeholder:text-[var(--faint)] ${
                                (drafts[line.id] ?? line.text).trim() !== line.text.trim() ? "ring-1 ring-[var(--soft)]" : "focus:ring-1 focus:ring-[var(--line)]"
                              }`}
                            />
                          </>
                        ) : (
                          <p className="text-[16px] leading-[1.5]">
                            {who ? <span className="font-semibold">{who}: </span> : null}
                            {line.text}
                          </p>
                        )}
                        {line.due_at ? <p className="mt-1 text-[13px] text-[var(--muted)]">{w.by(dayName(line.due_at, lang, zone))}</p> : null}
                        {mine ? (
                          <div className="mt-2 border-s-2 border-[var(--line)] ps-3">
                            <p className="text-[14px] leading-[1.5] text-[var(--soft)]">
                              <span className="text-[var(--muted)]">{w.yourChange}: </span>
                              {mine.text}
                            </p>
                            {mine.decision ? (
                              <p className="mt-0.5 text-[13px] text-[var(--muted)]">{mine.decision === "used" ? w.used(ownerFirst) : w.kept(ownerFirst)}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 px-1 text-[13px] leading-[1.5] text-[var(--faint)]">{w.only}</p>

            {earlier && mode === "view" ? (
              <div className="mt-8 rounded-[16px] bg-[var(--surface)] px-4 py-4">
                <p className="text-[15px] text-[var(--soft)]">
                  {earlier.status === "confirmed" ? w.already(dayName(earlier.at, lang, zone)) : w.alreadyFixed(dayName(earlier.at, lang, zone))}
                </p>
                {earlier.note ? (
                  <p className="mt-2 text-[14px] leading-[1.5] text-[var(--soft)]">
                    <span className="text-[var(--muted)]">{w.yourNote}: </span>
                    {earlier.note}
                  </p>
                ) : null}
                <button
                  onClick={() => {
                    setChanging(true);
                    setProblem(null);
                  }}
                  className="mt-3 text-[14px] font-medium text-[var(--fg)] underline-offset-4 hover:underline"
                >
                  {w.change}
                </button>
              </div>
            ) : null}

            {mode === "view" && !earlier ? (
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => void answer("confirm")}
                  disabled={busy !== null}
                  className="h-12 rounded-full bg-[var(--fg)] text-[16px] font-semibold text-[var(--bg)] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {busy === "confirm" ? w.sending : w.right}
                </button>
                <button
                  onClick={startFix}
                  disabled={busy !== null}
                  className="h-12 rounded-full bg-[var(--surface-hi)] text-[16px] font-medium text-[var(--fg)] transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {w.off}
                </button>
              </div>
            ) : null}

            {fixing ? (
              <div className="mt-6 flex flex-col gap-3">
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setProblem(null);
                  }}
                  placeholder={w.note}
                  aria-label={w.note}
                  maxLength={500}
                  rows={3}
                  disabled={busy !== null}
                  className="w-full resize-none rounded-[14px] bg-[var(--surface)] px-4 py-3 text-[16px] text-[var(--fg)] outline-none placeholder:text-[var(--faint)]"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={w.name}
                  aria-label={w.name}
                  maxLength={60}
                  disabled={busy !== null}
                  className="w-full rounded-[14px] bg-[var(--surface)] px-4 py-3 text-[16px] text-[var(--fg)] outline-none placeholder:text-[var(--faint)]"
                />
                <div className="mt-1 flex gap-3">
                  <button
                    onClick={() => {
                      setMode("view");
                      setProblem(null);
                    }}
                    disabled={busy !== null}
                    className="h-12 flex-1 rounded-full bg-[var(--surface-hi)] text-[16px] font-medium text-[var(--fg)]"
                  >
                    {w.cancel}
                  </button>
                  <button
                    onClick={() => void answer("fix")}
                    disabled={busy !== null}
                    className="h-12 flex-1 rounded-full bg-[var(--fg)] text-[16px] font-semibold text-[var(--bg)] disabled:opacity-60"
                  >
                    {busy === "fix" ? w.sending : w.send}
                  </button>
                </div>
              </div>
            ) : null}

            {problem ? (
              <p className="mt-4 text-[14px] text-[#C4574F]" role="alert">
                {problem}
              </p>
            ) : null}

            {mode === "done" && sent ? (
              <div className="mt-8 rounded-[16px] bg-[var(--surface)] px-4 py-4" role="status">
                <p className="text-[16px] leading-[1.5]">{sent === "confirmed" ? w.confirmedDone(ownerFirst) : w.fixedDone(ownerFirst)}</p>
                <button
                  onClick={() => {
                    setSent(null);
                    setChanging(true);
                    setMode("view");
                  }}
                  className="mt-3 text-[14px] font-medium text-[var(--fg)] underline-offset-4 hover:underline"
                >
                  {w.change}
                </button>
              </div>
            ) : null}

            <div className="mt-14 border-t border-[var(--line)] pt-6">
              <p className="text-[14px] leading-[1.6] text-[var(--muted)]">{w.about}</p>
              <a href="/" className="mt-3 inline-block text-[14px] font-medium text-[var(--fg)] no-underline">
                {w.get}
              </a>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
