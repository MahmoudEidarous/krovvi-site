import type { CSSProperties, ReactNode } from "react";

import {
  Choices as KitChoices,
  Composer as KitComposer,
  DateLine as KitDateLine,
  DeepChat,
  KrovviBubbles,
  KrovviText,
  MoveHeader as KitMoveHeader,
  MyBubble,
  P,
  Turn,
  Working as KitWorking,
} from "@/components/deep";
import { K_SMALL } from "@/components/mark";
import { PhoneSky } from "@/components/sky/phone-sky";

/**
 * Today's chat for the story's films, at the iPhone's 393 points (the site's
 * phones scale it to their glass). The pieces are the Deep kit's
 * (components/deep, drawn from the app's own numbers); these are the short
 * names the films use, each one row of the thread: Krovvi's texting bubbles,
 * the person's words with Krovvi's reaction, a plain answer with its star,
 * what a first move is about, the one tap answers, Krovvi at work, and a
 * date line. The bricks the kit does not draw yet (a list in an answer, the
 * row that says where something went) are drawn here.
 */

export const GLASS = "rgba(30,30,33,0.72)";
export const GLASS_EDGE = "inset 0 0 0 0.5px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.04)";

const TEXT = "#EDEDEB";
const MUTED = "#8F8F8A";

export function KDots({ size = 22, lit }: { size?: number; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="18 18 84 84" aria-hidden="true">
      {K_SMALL.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={8}
          fill={TEXT}
          className={lit ? "anim-loop" : undefined}
          style={lit ? ({ "--a": "k-think", "--dur": "1400ms", "--delay": `${i * 120}ms` } as CSSProperties) : undefined}
        />
      ))}
    </svg>
  );
}

/** The composer as the app draws it, empty unless told. */
export function Composer({ text, className, style }: { text?: string; className?: string; style?: CSSProperties }) {
  return <KitComposer text={text} className={className} style={style} />;
}

/** "Today 8:40 AM": the day, then the time, as the app writes it over a turn. */
export function DateLine({ children }: { children: string }) {
  const at = children.indexOf(" ");
  return <KitDateLine day={at > 0 ? children.slice(0, at) : children} time={at > 0 ? children.slice(at + 1) : ""} />;
}

/** What Krovvi's first move is about, over its first bubble. */
export function MoveHeader({ children, kind }: { children: string; kind?: "thread" | "event" | "person" | "mail" | "note" | "object" | "doc" }) {
  return (
    <Turn>
      <KitMoveHeader text={children} kind={kind} style={{ marginBottom: 0 }} />
    </Turn>
  );
}

/** A trailing emoji stays on the line of the word before it, never alone on a line of its own. */
function keepEmoji(n: ReactNode): ReactNode {
  return typeof n === "string" ? n.replace(/ (\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*)$/u, "\u00a0$1") : n;
}

/** One of Krovvi's texting bubbles. */
export function KBubble({ children }: { children: ReactNode }) {
  return (
    <Turn>
      <KrovviBubbles lines={[keepEmoji(children)]} />
    </Turn>
  );
}

/** The person's words on the right; `react` is Krovvi's reaction on its corner. */
export function MeBubble({ children, react }: { children: ReactNode; react?: string }) {
  return <MyBubble text={keepEmoji(children)} reaction={react} />;
}

/** A plain answer: the star before the turn, then the words. */
export function KText({ children, star = true }: { children: ReactNode; star?: boolean }) {
  return (
    <Turn>
      <KrovviText star={star}>
        <P>{children}</P>
      </KrovviText>
    </Turn>
  );
}

/** One tap answers under Krovvi's question; `picked` lights the one tapped. */
export function Choices({ options, picked }: { options: string[]; picked?: number }) {
  return (
    <Turn>
      <KitChoices options={options} picked={picked ?? null} style={{ marginTop: 4 }} />
    </Turn>
  );
}

/** Krovvi at work: the K's dots lighting in a small glass bubble. What it is doing is not shown, as in the app. */
export function Working(_: { children?: ReactNode }) {
  return <KitWorking />;
}

/** A screen inside an answer: a glass pane of rows, each with a mark, a title and a line under it. */
export function ListPane({ rows, className, style }: { rows: Array<{ mark: ReactNode; title: string; sub?: string }>; className?: string; style?: CSSProperties }) {
  return (
    <Turn>
    <div className={`overflow-hidden rounded-[18px] ${className ?? ""}`} style={{ background: "rgba(30,30,33,0.58)", boxShadow: GLASS_EDGE, ...style }}>
      {rows.map((r, i) => (
        <div key={r.title} className="flex items-center gap-[12px] px-[14px] py-[11px]" style={{ boxShadow: i ? "inset 0 0.5px 0 rgba(255,255,255,0.07)" : undefined }}>
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]" style={{ background: "rgba(255,255,255,0.06)" }}>
            {r.mark}
          </span>
          <span className="min-w-0">
            <span className="block text-[15.5px] font-medium leading-[20px]" style={{ color: TEXT }}>{r.title}</span>
            {r.sub && <span className="block text-[13.5px] leading-[18px]" style={{ color: MUTED }}>{r.sub}</span>}
          </span>
        </div>
      ))}
    </div>
    </Turn>
  );
}

/** Done: one glass row with the app's mark, saying where it went. */
export function DoneRow({ mark, title, sub, tint }: { mark: ReactNode; title: string; sub: string; tint: string }) {
  return (
    <Turn>
    <div className="flex items-center gap-[12px] rounded-[18px] px-[12px] py-[10px]" style={{ background: "rgba(30,30,33,0.58)", boxShadow: GLASS_EDGE }}>
      <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${tint}29`, boxShadow: `inset 0 0 0 0.5px ${tint}57` }}>
        {mark}
      </span>
      <span className="min-w-0">
        <span className="block text-[15.5px] font-medium leading-[20px]" style={{ color: TEXT }}>{title}</span>
        <span className="block text-[13.5px] leading-[18px]" style={{ color: MUTED }}>{sub}</span>
      </span>
    </div>
    </Turn>
  );
}

/** A simple mark drawn in the app's dots: points along a few short lines. */
export function DotMark({ d, color, size = 22 }: { d: Array<[number, number]>; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {d.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.15} fill={color} />
      ))}
    </svg>
  );
}

/** A chat screen: the kit's DeepChat on the phone's own still sky with the reading veil; the turns go in its column. */
export function ChatScreen({ children, composer }: { children: ReactNode; composer?: ReactNode }) {
  return (
    <div className="absolute inset-0">
      <DeepChat sky={<PhoneSky />} veil composer={composer} columnStyle={{ gap: 0, paddingTop: 6 }}>
        {children}
      </DeepChat>
    </div>
  );
}
