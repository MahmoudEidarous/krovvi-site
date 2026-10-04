"use client";

/**
 * The objects kit for the page: the same pieces the app draws them with
 * (catch8 src/components/objects/kit), in the browser. The answer look's six
 * type steps and inks, people's letters in their dots and tints, dots that
 * are data and ease to their new state on the app's curve, money with its
 * figure big and its mark small, a tick that fills ivory, hairline rows, a
 * swipe deck, and a moment's burst. Each kind's view (./kinds/<kind>.tsx)
 * is built from these and nothing else drawn by hand where one of these fits.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { initialOf } from "@/lib/letter-dots";
import { bare, lineIsRtl, type Lang } from "@/lib/objects";

/* ------------------------------------------------------------------ */
/* Tokens: the app's (theme/tokens.ts, components/answer/look.ts).      */
/* ------------------------------------------------------------------ */

export const INK = {
  bg: "#0A0A0A",
  surface: "#161615",
  surfaceHi: "#1F1F1E",
  line: "#262625",
  fg: "#EDEDEB",
  soft: "#A9A8A2",
  muted: "#8F8F8A",
  faint: "#7A7A74",
  pick: "#E6DCC8",
  up: "#8CC59A",
  down: "#E5876B",
  warm: "#E3AE62",
  cold: "#8DB8D6",
  track: "#2C2C2A",
} as const;

export const VOICE = ["#E6DCC8", "#C98A62", "#B0A89D", "#C2A470", "#8F7864", "#D4B49A"];

export const STEP = {
  display: { fontSize: 40, lineHeight: "46px", fontWeight: 600, letterSpacing: "-1.4px", fontVariantNumeric: "tabular-nums" },
  figure: { fontSize: 24, lineHeight: "29px", fontWeight: 600, letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums" },
  title: { fontSize: 17, lineHeight: "22px", fontWeight: 600, letterSpacing: "-0.3px" },
  body: { fontSize: 15, lineHeight: "21px", fontWeight: 400, letterSpacing: "-0.15px" },
  label: { fontSize: 13, lineHeight: "18px", fontWeight: 500 },
  meta: { fontSize: 12, lineHeight: "16px", fontWeight: 400 },
} satisfies Record<string, CSSProperties>;

/** The app's one curve: fast off the mark, landing once. */
export const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** A line of ours made only of people's words (a list of names, a day's things): it reads in the page's own direction, not the first name's. */
export function listOnly(text: string): boolean {
  return (text.match(/\u2068/g)?.length ?? 0) >= 2 && !/[A-Za-z\u0600-\u06FF]/.test(text.replace(/\u2068[^\u2069]*\u2069/g, ""));
}

/** A text's own direction, inside the page's layout. */
export function dirOf(text: string): "rtl" | "ltr" {
  return lineIsRtl(text) ? "rtl" : "ltr";
}

/* ------------------------------------------------------------------ */
/* People.                                                              */
/* ------------------------------------------------------------------ */

export function tintOf(raw: string): string {
  const name = bare(raw);
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return VOICE[h % VOICE.length];
}

/** A person's first letter in Krovvi's dots, in their own tint (the app's PersonFace). */
export function Face({ name, size = 28 }: { name: string; size?: number }) {
  const tint = tintOf(name);
  const initial = initialOf(bare(name) || "?");
  if ("text" in initial) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold" style={{ width: size, height: size, fontSize: size * 0.44, color: tint, background: INK.surfaceHi }} aria-hidden>
        {initial.text}
      </span>
    );
  }
  const small = size < 30;
  const pitch = (size * (small ? 0.64 : 0.56)) / 6;
  const r = pitch * (small ? 0.42 : 0.37);
  const x0 = size / 2 - ((initial.cols - 1) * pitch) / 2;
  const y0 = size / 2 - ((initial.rows - 1) * pitch) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={INK.surfaceHi} />
      {initial.dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x0 + x * pitch} cy={y0 + y * pitch} r={r} fill={tint} />
      ))}
    </svg>
  );
}

export function FaceStack({ names, size = 24, max = 5, label }: { names: string[]; size?: number; max?: number; label?: string }) {
  const shown = names.slice(0, max);
  const more = names.length - shown.length;
  const overlap = Math.round(size * 0.3);
  return (
    <span className="inline-flex items-center" role="img" aria-label={label ?? names.join(", ")}>
      {shown.map((n, i) => (
        <span key={`${n}-${i}`} className="rounded-full" style={{ marginInlineStart: i ? -overlap : 0, border: `2px solid ${INK.surface}`, zIndex: shown.length - i, lineHeight: 0 }}>
          <Face name={n} size={size} />
        </span>
      ))}
      {more > 0 ? (
        <span className="inline-flex items-center justify-center rounded-full" style={{ marginInlineStart: -overlap, width: size + 4, height: size + 4, background: INK.surfaceHi, border: `2px solid ${INK.surface}`, color: INK.soft, fontSize: Math.max(9, size * 0.42) }}>
          +{more}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Dots: each one is data.                                              */
/* ------------------------------------------------------------------ */

export interface Dot {
  on: boolean | number;
  tint?: string;
  now?: boolean;
}

const fillOf = (d: Dot) => (typeof d.on === "number" ? Math.max(0, Math.min(1, d.on)) : d.on ? 1 : 0);

/** A hundredth of a pixel: the server's HTML and the browser then write the same number, so a page hydrates clean. */
const px = (v: number) => Math.round(v * 100) / 100;

function DotSpan({ d, size, style }: { d: Dot; size: number; style?: CSSProperties }) {
  const fill = fillOf(d);
  const s = px(d.now ? size + 2 : size);
  return (
    <span aria-hidden style={{ position: "absolute", width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, ...style }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: INK.track }} />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: d.now && !fill ? INK.fg : (d.tint ?? INK.fg),
          opacity: d.now && !fill ? 1 : fill,
          transform: `scale(${fill || d.now ? 1 : 0.4})`,
          transition: `opacity 260ms ${EASE}, transform 260ms ${EASE}, background-color 260ms ${EASE}`,
        }}
      />
    </span>
  );
}

/** Dots around a circle, clockwise from twelve o'clock. */
export function DotRing({ size, dots, dot, inset = 0, label }: { size: number; dots: Dot[]; dot?: number; inset?: number; label?: string }) {
  const n = Math.max(1, dots.length);
  const d = px(dot ?? Math.max(4, Math.min(14, ((Math.PI * (size - inset * 2)) / n) * 0.62)));
  const radius = size / 2 - inset - d / 2 - 1;
  return (
    <div style={{ position: "relative", width: size, height: size }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {dots.map((x, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return <DotSpan key={i} d={x} size={d} style={{ left: px(size / 2 + Math.cos(a) * radius), top: px(size / 2 + Math.sin(a) * radius) }} />;
      })}
    </div>
  );
}

/** A row of dots that wraps. */
export function DotLine({ dots, dot = 7, gap = 5, label }: { dots: Dot[]; dot?: number; gap?: number; label?: string }) {
  return (
    <div className="flex flex-wrap items-center" style={{ gap }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {dots.map((x, i) => (
        <span key={i} style={{ position: "relative", width: dot + 2, height: dot + 2 }}>
          <DotSpan d={x} size={dot} style={{ left: (dot + 2) / 2, top: (dot + 2) / 2 }} />
        </span>
      ))}
    </div>
  );
}

/** What is left of a count, `cols` across: the first `total - left` have fallen away. */
export function DotField({ total, left, cols, dot = 10, gap = 8, tint = INK.fg, label }: { total: number; left: number; cols: number; dot?: number; gap?: number; tint?: string; label?: string }) {
  const fallen = Math.max(0, total - left);
  const rows = Math.ceil(total / cols);
  return (
    <div
      style={{ position: "relative", width: cols * dot + (cols - 1) * gap, height: rows * dot + (rows - 1) * gap }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: total }, (_, i) => {
        const gone = i < fallen;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              insetInlineStart: (i % cols) * (dot + gap),
              top: Math.floor(i / cols) * (dot + gap),
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: gone ? INK.track : tint,
              opacity: gone ? 0.55 : 1,
              transform: `translateY(${gone ? 2 : 0}px) scale(${gone ? 0.62 : 1})`,
              transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}, background-color 420ms ${EASE}`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Numbers and money.                                                   */
/* ------------------------------------------------------------------ */

/** A number that rolls to its new value (the first paint never rolls). */
export function Count({ value, format = (n) => String(Math.round(n)), step = "display", color = INK.fg }: { value: number; format?: (n: number) => string; step?: keyof typeof STEP; color?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const began = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - began) / 420);
      setShown(start + (value - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span style={{ ...STEP[step], color }}>{format(shown)}</span>;
}

const DECIMALS: Record<string, number> = { JPY: 0, KRW: 0, KWD: 3, BHD: 3, OMR: 3, JOD: 3, TND: 3 };
const MARKS: Record<string, { en: string; ar: string; before: boolean }> = {
  USD: { en: "$", ar: "$", before: true },
  EUR: { en: "€", ar: "€", before: true },
  GBP: { en: "£", ar: "£", before: true },
  JPY: { en: "¥", ar: "¥", before: true },
  EGP: { en: "EGP", ar: "جنيه", before: false },
  SAR: { en: "SAR", ar: "ريال", before: false },
  AED: { en: "AED", ar: "درهم", before: false },
};

export function moneyParts(minor: number, currency: string, lang: Lang) {
  const places = DECIMALS[currency] ?? 2;
  const value = Math.abs(minor) / 10 ** places;
  const whole = Math.abs(minor) % 10 ** places === 0;
  const mark = MARKS[currency];
  return {
    figure: value.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : places, maximumFractionDigits: whole ? 0 : places }),
    mark: mark ? mark[lang] : currency,
    before: mark ? mark.before : false,
    negative: minor < 0,
  };
}

/** Money the look's way: the figure big, the mark small and muted, one unit left to right even inside Arabic. */
export function Money({ minor, currency, lang, step = "figure", color = INK.fg, sign }: { minor: number; currency: string; lang: Lang; step?: "display" | "figure" | "title" | "body"; color?: string; sign?: boolean }) {
  const p = moneyParts(minor, currency, lang);
  const lead = p.negative ? "-" : sign && minor > 0 ? "+" : "";
  const markStep = step === "display" ? STEP.title : step === "figure" ? STEP.label : STEP.meta;
  const mark = <span style={{ ...markStep, color: INK.muted }}>{p.mark}</span>;
  return (
    <span dir="ltr" className="inline-flex items-baseline" style={{ gap: 3 }}>
      {p.before ? mark : null}
      <span style={{ ...STEP[step], color }}>{`${lead}${p.figure}`}</span>
      {!p.before ? mark : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Ticks, rows, pills.                                                  */
/* ------------------------------------------------------------------ */

export function Tick({ done, by, onClick, label, size = 26 }: { done: boolean; by?: string | null; onClick?: () => void; label: string; size?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-full" style={{ border: `1.5px solid ${INK.faint}` }} />
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{ background: INK.fg, opacity: done ? 1 : 0, transform: `scale(${done ? 1 : 0.6})`, transition: `opacity 220ms ${EASE}, transform 220ms ${EASE}` }}
      >
        <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={INK.bg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {done && by ? (
        <span className="absolute rounded-full" style={{ insetInlineEnd: -size * 0.22, bottom: -size * 0.18, border: `1.5px solid ${INK.surface}`, lineHeight: 0 }}>
          <Face name={by} size={Math.round(size * 0.58)} />
        </span>
      ) : null}
    </button>
  );
}

/** One card per section: a quiet header, rows split by hairlines inset from the reading edge. */
export function Section({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-3 overflow-hidden" style={{ background: INK.surface, borderRadius: 17 }}>
      {title || action ? (
        <div className="flex items-center justify-between" style={{ padding: "12px 16px 4px" }}>
          {title ? <h3 style={{ ...STEP.label, color: INK.muted }}>{title}</h3> : <span />}
          {action ?? null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Row({ lead, title, sub, value, onClick, first, muted, ours }: { lead?: ReactNode; title: string; sub?: string | null; value?: ReactNode; onClick?: () => void; first?: boolean; muted?: boolean; /** The title is one of the page's own sentences (a line of what happened): it reads in the page's direction. */ ours?: boolean }) {
  const body = (
    <div className="flex items-center" style={{ gap: 12, padding: "11px 16px", minHeight: 48 }}>
      {lead ? <span className="flex shrink-0 items-center justify-center" style={{ minWidth: 28 }}>{lead}</span> : null}
      {/* Each line lines up with the page (an English name stands where the Arabic ones do) and reads in its own letters' direction inside its bdi. */}
      <span className="min-w-0 flex-1">
        <span className="block" style={{ ...STEP.body, color: muted ? INK.muted : INK.fg, textAlign: "start" }}>
          {ours || listOnly(title) ? <span>{title}</span> : <bdi dir={dirOf(title)}>{title}</bdi>}
        </span>
        {sub ? (
          <span className="block" style={{ ...STEP.meta, color: INK.muted, textAlign: "start" }}>
            {listOnly(sub) ? <span>{sub}</span> : <bdi dir={dirOf(sub)}>{sub}</bdi>}
          </span>
        ) : null}
      </span>
      {value ? <span className="shrink-0">{value}</span> : null}
    </div>
  );
  return (
    <div>
      {first ? null : <div style={{ height: 0.5, background: INK.line, marginInlineStart: 16 }} />}
      {onClick ? (
        <button type="button" onClick={onClick} className="block w-full text-start active:opacity-70">
          {body}
        </button>
      ) : (
        body
      )}
    </div>
  );
}

export function Pill({ text, onClick, strong, disabled }: { text: string; onClick: () => void; strong?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full transition-transform active:scale-[0.97] disabled:opacity-40"
      style={{ ...STEP.label, fontWeight: 600, padding: "0 14px", height: 34, background: strong ? INK.fg : INK.surfaceHi, color: strong ? INK.bg : INK.fg }}
    >
      {text}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Moments.                                                             */
/* ------------------------------------------------------------------ */

/** A burst of dots and one short line, once, for a real win. With reduced motion, the line alone. */
export function Moment({ line, play, burst = true }: { line: string; play: number; /** False for a moment that is not a win (the kind's momentFeel): the line, no dots. */ burst?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!play) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 1400);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const c = canvas.current;
    if (reduce || !burst || !c) return () => clearTimeout(hide);
    const ctx = c.getContext("2d");
    if (!ctx) return () => clearTimeout(hide);
    const size = 300;
    const ratio = window.devicePixelRatio || 1;
    c.width = size * ratio;
    c.height = size * ratio;
    ctx.scale(ratio, ratio);
    const tints = [INK.fg, VOICE[0], VOICE[3], VOICE[1]];
    const parts = Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2 + Math.random() * 0.5;
      const d = size * 0.48 * (0.45 + Math.random() * 0.55);
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: 2.5 + Math.random() * 3, tint: tints[i % tints.length] };
    });
    const began = performance.now();
    let frame = 0;
    const draw = (t: number) => {
      const p = Math.min(1, (t - began) / 900);
      const v = 1 - Math.pow(1 - p, 3);
      ctx.clearRect(0, 0, size, size);
      ctx.globalAlpha = 1 - v * v;
      for (const q of parts) {
        ctx.fillStyle = q.tint;
        ctx.beginPath();
        ctx.arc(size / 2 + q.dx * v, size / 2 + q.dy * v, Math.max(0.5, q.r * (1 - 0.45 * v)), 0, Math.PI * 2);
        ctx.fill();
      }
      if (p < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hide);
    };
    // How it looks rides with its play: a new burst only for a new play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" role="status" aria-live="polite">
      <canvas ref={canvas} style={{ width: 300, height: 300, position: "absolute" }} />
      <span className="rounded-full" style={{ ...STEP.title, fontSize: 22, lineHeight: "28px", padding: "8px 16px", background: "rgba(10,10,10,0.72)", animation: `objMoment 1400ms ${EASE} forwards` }}>
        {line}
      </span>
    </div>
  );
}
