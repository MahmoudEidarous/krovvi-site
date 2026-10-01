/**
 * Krovvi's chat, drawn to the app's own numbers (catch8 app/agent.tsx,
 * components/answer/sources.tsx, memory/turn-chip.tsx, glyph.tsx; the spec
 * is in the site's notes). One screen is 393 by 852 points: the nav row at
 * 59, the thread from 111, the composer field from 750. Nothing here moves
 * by itself; the films that use it time each piece with the .anim helper.
 */
import type { CSSProperties, ReactNode } from "react";

import { KGlyph, StatusBar } from "./ui";

/* ── Glyphs, as glyph.tsx draws them: flat bars with round ends ─────────── */

export function PlusGlyph({ size = 16, color = "#8F8F8A", weight = 1.6 }: { size?: number; color?: string; weight?: number }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path d={`M${c} ${weight / 2}V${size - weight / 2}M${weight / 2} ${c}H${size - weight / 2}`} stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </svg>
  );
}

export function CrossGlyph({ size = 15, color = "#8F8F8A", weight = 1.7 }: { size?: number; color?: string; weight?: number }) {
  const c = size / 2;
  const h = (size / 2) * Math.SQRT1_2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path d={`M${c - h} ${c - h}L${c + h} ${c + h}M${c + h} ${c - h}L${c - h} ${c + h}`} stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </svg>
  );
}

export function ArrowUpGlyph({ size = 14, color = "#0A0A0A", weight = 2 }: { size?: number; color?: string; weight?: number }) {
  const c = size / 2;
  const a = 0.46 * size * Math.SQRT1_2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path d={`M${c} ${size - 1}V1M${c - a} ${1 + a}L${c} 1L${c + a} ${1 + a}`} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The dot mic: an open capsule with three dots, its cradle and stand. */
export function MicGlyph({ size = 17, color = "#0A0A0A", weight = 1.6 }: { size?: number; color?: string; weight?: number }) {
  const w = (weight * 24) / size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="2.5" width="8" height="13" rx="4" fill="none" stroke={color} strokeWidth={w} />
      {[6.2, 9, 11.8].map((y) => (
        <circle key={y} cx="12" cy={y} r="1.25" fill={color} />
      ))}
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v4.5M8.8 22.5h6.4" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

/** Past conversations: a ring of eight dots round a centre, and one short hand. */
function PastGlyph({ size = 24, color = "#8F8F8A" }: { size?: number; color?: string }) {
  const r = Math.max(1.6, (2.7 * size) / 24) / 2;
  const ring = (8 / 24) * size;
  const c = size / 2;
  const hand = (4.4 / 24) * size;
  const angle = (36 * Math.PI) / 180;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <circle key={i} cx={c + ring * Math.sin(a)} cy={c - ring * Math.cos(a)} r={r} fill={color} />;
      })}
      <circle cx={c} cy={c} r={r} fill={color} />
      <path d={`M${c} ${c}L${c + hand * Math.sin(angle)} ${c - hand * Math.cos(angle)}`} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DocGlyph({ size = 13, color = "#8F8F8A" }: { size?: number; color?: string }) {
  const w = 0.78 * size;
  const x = (size - w) / 2;
  const r = Math.max(2.5, 0.16 * size);
  const pad = w * 0.24;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect x={x + 0.6} y={0.6} width={w - 1.2} height={size - 1.2} rx={r} fill="none" stroke={color} strokeWidth="1.2" />
      <path d={`M${x + pad} ${size * 0.4}H${x + w - pad}M${x + pad} ${size * 0.6}H${x + pad + (w - 2 * pad) * 0.6}`} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ActionIcons() {
  const s = { fill: "none", stroke: "#7A7A74", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <div className="flex items-center gap-[16px]">
      <span className="flex h-[26px] w-[30px] items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="4.2" y="0.75" width="9" height="9" rx="2.5" {...s} />
          <rect x="0.75" y="4.25" width="9" height="9" rx="2.5" fill="#0A0A0A" stroke="#7A7A74" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="flex h-[26px] w-[30px] items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M7 8.6V1M4.5 3.4 7 0.9l2.5 2.5M4.4 6.2H2.6v5.4c0 .9.7 1.6 1.6 1.6h5.6c.9 0 1.6-.7 1.6-1.6V6.2H9.6" {...s} />
        </svg>
      </span>
      <span className="flex h-[26px] w-[30px] items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" fill="none" stroke="#7A7A74" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex h-[26px] w-[30px] items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M9.5 2.7a5 5 0 1 0 2.4 3.6" {...s} />
          <path d="M9.2 0.9 9.6 2.8 7.7 3.4" {...s} />
        </svg>
      </span>
    </div>
  );
}

/* ── The wordmark on an empty chat: "krovvi" in 46 equal dots ───────────── */

const WORD_DOTS: Array<[number, number]> = (() => {
  const K: Array<[number, number]> = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0.875, 1.375], [1.75, 0.75], [2.625, 0.125], [0.875, 2.625], [1.75, 3.25], [2.625, 3.875]];
  const R: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [0, 4], [0.85, 1], [1.7, 1.2]];
  const O: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 10;
    return [1.5 + 1.5 * Math.cos(a), 2.5 - 1.5 * Math.sin(a)];
  });
  const V: Array<[number, number]> = [[0, 1], [0.42, 2], [0.83, 3], [1.25, 4], [1.67, 3], [2.08, 2], [2.5, 1]];
  const I: Array<[number, number]> = [[0, -0.3], [0, 1], [0, 2], [0, 3], [0, 4]];
  const at = (pts: Array<[number, number]>, dx: number) => pts.map(([x, y]) => [x + dx, y] as [number, number]);
  return [...at(K, 0), ...at(R, 3.825), ...at(O, 6.725), ...at(V, 10.925), ...at(V, 14.425), ...at(I, 18.125)];
})();

export function Wordmark({ pitch = 8, color = "#EDEDEB" }: { pitch?: number; color?: string }) {
  return (
    <svg width={19.4 * pitch} height={5.4 * pitch} viewBox="-0.6 -0.85 19.4 5.4" aria-label="krovvi">
      {WORD_DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.40625} fill={color} />
      ))}
    </svg>
  );
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

/** Status bar and the nav row: the small K on the left (once there is a message), past chats and close on the right. */
export function ChatNav({ k = true, kStyle, kClass }: { k?: boolean; kStyle?: CSSProperties; kClass?: string }) {
  return (
    <>
      <StatusBar />
      <div className="absolute inset-x-[20px] top-[59px] flex h-[40px] items-center justify-between">
        <span className={`self-start pt-[10px] ${kClass ?? ""}`} style={k ? kStyle : { opacity: 0 }}>
          <KGlyph size={22} />
        </span>
        <span className="flex items-center gap-[12px]">
          <span className="flex h-[40px] w-[40px] items-center justify-center">
            <PastGlyph />
          </span>
          <span className="-mr-[12px] flex h-[40px] w-[40px] items-center justify-center">
            <CrossGlyph />
          </span>
        </span>
      </div>
    </>
  );
}

/** The person's message: words in a raised bubble, its bottom right corner tucked. */
export function UserBubble({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[288px] rounded-[17px] rounded-br-[6px] bg-card-hi px-[14px] py-[10px] text-[15px] leading-[19px] tracking-[-0.15px] text-ink ${className ?? ""}`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

/** A moment from a recording, cited inside the sentence: play, its title and the second. */
export function Receipt({ title, at, kind = "rec", className, style }: {
  title: string;
  at?: string;
  kind?: "rec" | "doc";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <>
      {" "}
      <span
        className={`relative top-[-3px] inline-flex h-[20px] max-w-[220px] items-center gap-[5px] whitespace-nowrap rounded-[10px] bg-card-hi pl-[4px] pr-[8px] align-middle ${className ?? ""}`}
        style={style}
      >
        {kind === "rec" ? (
          <span
            className="ml-[3px] mr-[1px] h-0 w-0"
            style={{ borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6.5px solid #A9A8A2" }}
          />
        ) : (
          <span className="ml-[1px]">
            <DocGlyph size={13} />
          </span>
        )}
        <span className="truncate text-[12px] font-medium leading-none text-soft">{title}</span>
        {at && <span className="text-[11px] leading-none text-faint tabular">{at}</span>}
      </span>
    </>
  );
}

/** Under a finished answer: the stack of what it rested on, and how many. */
export function SourcesLine({ count, docs = 0 }: { count: number; docs?: number }) {
  const shown = Math.min(3, count);
  return (
    <div className="flex items-center gap-[8px]">
      <span className="flex">
        {Array.from({ length: shown }, (_, i) => (
          <span
            key={i}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-2 border-ground bg-card-hi"
            style={{ marginLeft: i === 0 ? 0 : -7 }}
          >
            {i < docs ? (
              <DocGlyph size={11} color="#A9A8A2" />
            ) : (
              <span
                className="ml-[1px] h-0 w-0"
                style={{ borderTop: "3.5px solid transparent", borderBottom: "3.5px solid transparent", borderLeft: "5.5px solid #A9A8A2" }}
              />
            )}
          </span>
        ))}
      </span>
      <span className="text-[12.5px] font-medium text-faint">
        {count} {count === 1 ? "source" : "sources"}
      </span>
    </div>
  );
}

export { ActionIcons };

/** What the turn saved, under the answer: each line with the small K and Undo. */
export function MemoryChip({ lines, className, style }: { lines: string[]; className?: string; style?: CSSProperties }) {
  return (
    <div className={`flex flex-col gap-[6px] rounded-[11px] bg-card px-[12px] py-[10px] ${className ?? ""}`} style={style}>
      {lines.map((line) => (
        <div key={line} className="flex items-start justify-between gap-[8px]">
          <span className="flex min-w-0 items-start">
            <span className="w-[14px] shrink-0 pt-[4px]">
              <KGlyph size={11} color="#8F8F8A" />
            </span>
            <span className="ml-[4px] text-[13.5px] leading-[19.6px] tracking-[-0.1px] text-soft">{line}</span>
          </span>
          <span className="flex h-[24px] shrink-0 items-center gap-[4px] rounded-full bg-card-hi px-[9px] text-[12px] font-medium text-ink">
            <svg width="9" height="8" viewBox="0 0 14 12" fill="none" stroke="#A9A8A2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4.5 1 1.5 4l3 3" />
              <path d="M1.8 4h6.7a4 4 0 0 1 0 8H5" />
            </svg>
            Undo
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * While it works: an arc spinner, the line of what it is doing with a light
 * passing over the words, and a clock. Gone the moment the answer starts.
 */
export function WorkingStrip({ status, tick = 1000, className, style }: {
  status: string;
  /** When the clock turns to 0:01, in ms from when the screen started. */
  tick?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const words = status.split(" ");
  return (
    <div className={`flex h-[26px] items-center gap-[9px] ${className ?? ""}`} style={style}>
      <span className="flex h-[20px] w-[20px] items-center justify-center">
        <span
          className="block h-[13px] w-[13px] rounded-full"
          style={{ border: "2px solid rgba(143,143,138,0.18)", borderTopColor: "#8F8F8A", animation: "k-spin 800ms linear infinite" }}
        />
      </span>
      <span className="flex flex-1 gap-[4px] text-[13px] text-ink">
        {words.map((w, i) => (
          <span key={i} style={{ animation: `k-sweep 1500ms linear ${i * 160}ms infinite both` }}>
            {w}
          </span>
        ))}
      </span>
      <span className="relative text-[12px] text-faint tabular">
        <span style={{ animation: `k-hide 1ms linear ${tick}ms forwards` }}>0:00</span>
        <span className="absolute right-0 top-0" style={{ animation: `k-show 1ms linear ${tick}ms both` }}>0:01</span>
      </span>
    </div>
  );
}

/* ── The composer ───────────────────────────────────────────────────────── */

/**
 * The field at the bottom: plus, the words, and the one white disc (the dot
 * mic when empty, the arrow once there are words). Callers pass what is
 * inside: plain text, typed text, or the dictation bar.
 */
export function ComposerField({ children, disc, className, rowStyle, discStyle, overlay }: {
  children: ReactNode;
  disc: ReactNode;
  className?: string;
  /** Timing for the plus, words and disc row (it steps aside while dictating). */
  rowStyle?: CSSProperties;
  /** Timing for the disc itself, such as its press. */
  discStyle?: CSSProperties;
  /** Drawn over the field, such as the dictation bar. */
  overlay?: ReactNode;
}) {
  return (
    <div className={`absolute inset-x-[20px] bottom-[50px] ${className ?? ""}`}>
      <div className="relative rounded-[26px] border-[0.5px] border-line bg-card-hi p-[6px]">
        <div className="seq flex items-end gap-[8px]" style={rowStyle}>
          <span className="ml-[-2px] flex h-[40px] w-[34px] shrink-0 items-center justify-center">
            <PlusGlyph />
          </span>
          <div className="relative min-h-[40px] flex-1 px-[8px] py-[10px] text-[16px] leading-[20px] tracking-[-0.15px] text-ink">{children}</div>
          <span className="seq relative mb-[3px] h-[34px] w-[34px] shrink-0 rounded-full bg-ink" style={discStyle}>
            {disc}
          </span>
        </div>
        {overlay}
      </div>
    </div>
  );
}

/**
 * Speaking instead of typing: the field becomes the dictation bar. Cancel,
 * the clock, a live waveform (newest on the right, brightest), stop, send.
 */
export function DictationBar({ className, style, tick = 1000 }: { className?: string; style?: CSSProperties; tick?: number }) {
  const amps = [0.3, 0.55, 0.42, 0.8, 0.62, 0.95, 0.5, 0.72, 1, 0.66, 0.84, 0.45, 0.9, 0.7, 0.98, 0.58, 0.86, 0.64, 1, 0.76, 0.92, 0.7];
  return (
    <div className={`absolute inset-[6px] flex h-[40px] items-center gap-[8px] px-[4px] ${className ?? ""}`} style={style}>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-line">
        <CrossGlyph size={13} color="#EDEDEB" />
      </span>
      <span className="relative min-w-[30px] text-[12px] text-muted tabular">
        <span style={{ animation: `k-hide 1ms linear ${tick}ms forwards` }}>0:00</span>
        <span className="absolute left-0 top-0" style={{ animation: `k-show 1ms linear ${tick}ms both` }}>0:01</span>
      </span>
      <span className="flex h-[22px] flex-1 items-center justify-between">
        {amps.map((amp, i) => (
          <span
            key={i}
            className="bar block h-[22px] w-[2.5px] rounded-full bg-ink"
            style={
              {
                opacity: 0.32 + (0.68 * i) / (amps.length - 1),
                "--amp": amp,
                "--t": `${0.7 + (i % 4) * 0.13}s`,
                "--d": `${-i * 90}ms`,
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-line">
        <span className="block h-[13px] w-[13px] rounded-[3.5px] bg-ink" />
      </span>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ink">
        <ArrowUpGlyph size={13} />
      </span>
    </div>
  );
}

/** A disc face, centred in the white disc. */
export function DiscFace({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={`absolute inset-0 flex items-center justify-center ${className ?? ""}`} style={style}>
      {children}
    </span>
  );
}

/** The stop square the disc shows while an answer is being written. */
export function StopSquare() {
  return <span className="block h-[11px] w-[11px] rounded-[3px] bg-ground" />;
}

/* ── Cards that sit above the composer or in the thread ─────────────────── */

/** "Before it sends": a draft waiting for a yes, between the thread and the composer. */
export function DraftCard({ to, subject, body, className, style, toFace }: {
  to: string;
  subject: string;
  body: string;
  className?: string;
  style?: CSSProperties;
  toFace?: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-[8px] rounded-[17px] bg-card px-[16px] py-[12px] ${className ?? ""}`} style={style}>
      <div className="flex items-center gap-[8px]">
        <span className="flex-1 text-[14px] font-medium tracking-[-0.3px] text-ink">Before it sends</span>
        <span className="text-[12px] text-faint">Valid for 30 minutes</span>
        <CrossGlyph size={10} />
      </div>
      <div className="flex gap-[8px]">
        <span className="w-[52px] pt-[1px] text-[12px] text-faint">To</span>
        <span className="flex items-center gap-[6px] text-[14px] text-soft">
          {toFace}
          {to}
        </span>
      </div>
      <div className="flex gap-[8px]">
        <span className="w-[52px] pt-[1px] text-[12px] text-faint">Subject</span>
        <span className="text-[14px] font-semibold text-ink">{subject}</span>
      </div>
      <div className="text-[14px] leading-[21px] text-soft">{body}</div>
      <div className="flex items-center gap-[12px] pt-[2px]">
        <span className="rounded-full bg-ink px-[24px] py-[8px] text-[14px] font-medium tracking-[-0.3px] text-ground">Send it</span>
        <span className="p-[8px] text-[14px] text-muted">Change it</span>
      </div>
    </div>
  );
}

/** A file sent with a message: a card above the bubble with its badge, name and kind. */
export function FileCard({ name, kind, tint, className, style }: { name: string; kind: string; tint: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`flex items-center gap-[12px] rounded-[17px] bg-card px-[14px] py-[12px] ${className ?? ""}`} style={style}>
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-card-hi">
        <DocGlyph size={16} color={tint} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold tracking-[-0.15px] text-ink">{name}</span>
        <span className="block text-[11px] tracking-[0.3px] text-faint">{kind}</span>
      </span>
    </div>
  );
}

/** Krovvi's words: 16 points on a 27.2 line, full width, no bubble and no name. */
export function AnswerText({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`text-[16px] leading-[27.2px] tracking-[-0.2px] text-ink ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

/** A bullet row as the app draws it: a 5 point muted disc, 12 points before the words. */
export function Bullet({ children, className, style, dotClass, dotStyle }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  dotClass?: string;
  dotStyle?: CSSProperties;
}) {
  return (
    <div className={`flex ${className ?? ""}`} style={style}>
      <span className={`ml-[3px] mr-[12px] mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-muted ${dotClass ?? ""}`} style={dotStyle} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
