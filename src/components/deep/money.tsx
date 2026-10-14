/**
 * Money's first page, Overview, as the newest app draws it (catch8 store build
 * 20, 6edb7fca: src/components/objects/kinds/spending/overview.tsx on the
 * object kit, kit/blocks.tsx, kit/found.tsx, kit/tick.tsx, kit/mark.tsx):
 * the app's page with its tabs (the kit's AppPage), the month in its own
 * number with what is left after the bills still due and about how much that
 * is a day, a row of thirty dots for it, the spends that wait for a yes with
 * the cross and Confirm, the bills coming up with their ticks, and Krovvi's
 * bar over the page's foot.
 *
 * Since money.png was taken (before 10 October) the month's line says what is
 * left after the bills still due, "$1,394 left after bills, about $77 a day"
 * (spending/copy.ts monthLine), the dots hold the bills back in a quieter
 * ink, and the bar's mic stands in the chat's ivory disc; this draws today's.
 * Server renderable; content through props.
 */

import "./deep.css";

import type { CSSProperties, ReactNode } from "react";

import { type Piece } from "./chat";
import { Icon } from "./glyphs";
import { AppPage } from "./page";
import { C, FACE, HAIR } from "./tokens";

/** Money's colour (the core's apps.ts APP.money.tint). */
export const MONEY_TINT = "#E3B062";

/** The categories' colours (spending/shaped.ts CAT_TINT). */
export const CATEGORY_TINT = {
  groceries: "#8CC59A",
  eating: "#EE9068",
  transport: "#86B9E0",
  home: "#C3CF73",
  bills: "#E3B062",
  shopping: "#D796D6",
  fun: "#B7A6EC",
  health: "#EC8FA3",
  travel: "#6FC9B9",
  gifts: "#E6DCC8",
  other: "#8F8F8A",
} as const;

/** The categories' marks, line drawings on 24 units (supabase/functions/_shared/objects/marks.ts). */
const MARKS = {
  cart: "M2.5 3.5h2.4l2.3 11.1a1.6 1.6 0 0 0 1.6 1.3h9.1a1.6 1.6 0 0 0 1.6-1.2L21 7.5H5.7 M9.5 20.2h.01 M17.5 20.2h.01",
  receipt: "M5.5 3.5h13v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4-2.2 1.4z M9 8h6 M9 11.5h6 M9 15h3.5",
  bag: "M5.2 8h13.6l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.6a1.5 1.5 0 0 1-1.5-1.4z M9 10V7a3 3 0 0 1 6 0v3",
  ticket: "M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.2a2.4 2.4 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2.2a2.4 2.4 0 0 0 0-4.6z M14.5 6v2 M14.5 11v2 M14.5 16v2",
  heart: "M12 20s-8-4.7-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.3 12 20 12 20z",
  tag: "M3.5 4.9v6.4a1.5 1.5 0 0 0 .4 1l8 8a1.5 1.5 0 0 0 2.1 0l6.3-6.3a1.5 1.5 0 0 0 0-2.1l-8-8a1.5 1.5 0 0 0-1-.4H4.9a1.4 1.4 0 0 0-1.4 1.4z M8 8h.01",
  wallet: "M19.5 7.5V6a1.5 1.5 0 0 0-1.5-1.5H5.5a2.5 2.5 0 0 0 0 5h14a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5H5.5A2.5 2.5 0 0 1 3 17.5V7 M16.5 14.5h.01",
} as const;

export type MoneyMark = keyof typeof MARKS;

/** A mark (kit/mark.tsx): a line drawing in its colour, the line max(1.35, 0.075 of its size) (core markWeight). */
function Mark({ name, size, color }: { name: MoneyMark; size: number; color: string }) {
  const weight = Math.max(1.35, size * 0.075);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <path d={MARKS[name]} fill="none" stroke={color} strokeWidth={(weight * 24) / size} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** kit/tint.tsx over: a colour at `t` over another, as one solid colour. */
function over(hex: string, base: string, t: number): string {
  const ch = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = ch(hex);
  const b = ch(base);
  return `#${a.map((v, i) => Math.round(b[i] + (v - b[i]) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** A pane on the app's page (kit/ground.tsx pagePane, theme/pane.ts night): #0E0E10, corners 20, one hairline, 12 under it. */
const PANE: CSSProperties = { background: C.surface, borderRadius: 20, border: `${HAIR}px solid ${C.edge}`, overflow: "hidden", marginBottom: 12 };

/** kit/blocks.tsx GroupHead: the group's name 20 on 25 semibold, 4 in, 12 over and 8 under it; a count or an action across. */
function GroupHead({ title, value, action }: { title: string; value?: string; action?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 4px 8px" }}>
      <span style={{ fontSize: 20, lineHeight: "25px", fontWeight: 600, letterSpacing: "-0.5px", color: C.fg }}>{title}</span>
      {action ? (
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ ...FACE.label, color: C.muted }}>{action}</span>
          <Icon name="chevronRight" size={9} color={C.faint} weight={1.7} />
        </span>
      ) : value ? (
        <span style={{ ...FACE.label, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      ) : null}
    </div>
  );
}

/**
 * A row of a list in an app (kit/blocks.tsx Item): its tile, its name 15 on
 * 21 medium with a line under it 12 on 16 muted, a figure across, and its own
 * control at the far edge; at least 60 tall, 10 over and under, 16 at the
 * sides, a hairline from 72 in (16 with no tile).
 */
function Row({ first, lead, title, sub, value, trail }: { first: boolean; lead?: ReactNode; title: string; sub?: string; value?: string; trail?: ReactNode }) {
  return (
    <div>
      {first ? null : <div style={{ height: HAIR, background: C.line, marginLeft: lead ? 72 : 16 }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", minHeight: 60 }}>
        {lead ? <span style={{ width: 44, display: "flex", justifyContent: "center", flexShrink: 0 }}>{lead}</span> : null}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ ...FACE.body, fontWeight: 500, color: C.fg }}>{title}</span>
          {sub ? <span style={{ ...FACE.meta, color: C.muted }}>{sub}</span> : null}
        </div>
        {value ? <span style={{ ...FACE.body, fontWeight: 500, color: C.fg, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</span> : null}
        {trail}
      </div>
    </div>
  );
}

/** kit/blocks.tsx IconTile: the mark in its colour, half the tile, on a raised step (#18181A) with one hairline, corners 0.28 of it. */
function IconTile({ mark, tint, size = 44 }: { mark: MoneyMark; tint: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, background: C.surfaceHi, border: `${HAIR}px solid ${C.edge}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Mark name={mark} size={Math.round(size * 0.5)} color={tint} />
    </span>
  );
}

/** kit/found.tsx Answers: the cross that leaves it out (32, raised) and the yes in the app's colour (32 tall, 14 at the sides). */
function Answers({ yes, tint }: { yes: string; tint: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <span style={{ width: 32, height: 32, borderRadius: 16, background: C.surfaceHi, border: `${HAIR}px solid ${C.edge}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="cross" size={11} color={C.soft} weight={1.8} />
      </span>
      <span style={{ height: 32, padding: "0 14px", borderRadius: 16, background: over(tint, C.surfaceHi, 0.16), display: "flex", alignItems: "center" }}>
        <span style={{ ...FACE.label, fontWeight: 600, color: tint, whiteSpace: "nowrap" }}>{yes}</span>
      </span>
    </span>
  );
}

/** kit/tick.tsx Tick: a 26 point ring of 1.5 faint, filled ivory with its tick once done. */
function Tick() {
  return <span style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px solid ${C.faint}`, flexShrink: 0 }} />;
}

/**
 * kit/blocks.tsx DotBar, the month's row (overview.tsx MONTH_DOTS 30, 5
 * across): spread edge to edge, what was spent in the app's colour with the
 * dot it has reached in its own light, then the bills still due in faint,
 * then the rest ivory at an eighth.
 */
function DotBar({ share, held = 0, tint, n = 30, dot = 5, width }: { share: number; held?: number; tint: string; n?: number; dot?: number; width: number }) {
  const safe = Math.max(0, Math.min(1, share));
  const lit = safe > 0 ? Math.min(n, Math.max(1, Math.round(n * safe))) : 0;
  const more = held > 0 ? Math.min(n - lit, Math.max(1, Math.round(n * Math.min(1, held)))) : 0;
  const step = (width - dot) / (n - 1);
  const head = lit > 0 && lit < n ? lit - 1 : -1;
  const halo = dot * 3.6;
  const r = dot / 2;
  const c = (i: number) => `M${(r + i * step - r).toFixed(2)} ${r}a${r} ${r} 0 1 0 ${dot} 0a${r} ${r} 0 1 0 ${-dot} 0Z`;
  const run = (a: number, b: number) => Array.from({ length: Math.max(0, b - a) }, (_, k) => c(a + k)).join("");
  const rgb = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16)).join(",");
  return (
    <div style={{ position: "relative", width, height: 8 }} aria-hidden="true">
      {head >= 0 ? (
        <span
          style={{
            position: "absolute",
            left: r + head * step - halo / 2,
            top: (8 - halo) / 2,
            width: halo,
            height: halo,
            background: `radial-gradient(circle closest-side, rgba(${rgb},0.5) 0%, rgba(${rgb},0.16) 45%, rgba(${rgb},0) 100%)`,
          }}
        />
      ) : null}
      <svg width={width} height={dot} viewBox={`0 0 ${width} ${dot}`} style={{ position: "absolute", left: 0, top: (8 - dot) / 2, overflow: "visible" }}>
        <path d={run(lit + more, n)} fill="rgba(237,237,235,0.12)" />
        <path d={run(lit, lit + more)} fill={C.faint} />
        <path d={run(0, lit)} fill={tint} />
      </svg>
    </div>
  );
}

export interface ConfirmRow {
  title: string;
  /** "$12.75 · Sat 3 Oct · from a receipt". */
  sub: string;
  mark: MoneyMark;
  tint: string;
}

export interface BillRowProps {
  title: string;
  /** "Due Fri 16 Oct". */
  sub: string;
  /** "$15.99". */
  value: string;
}

/** The demo world's month: $1,104 spent of $2,600, $101.98 of bills still due, 18 days of October left (today 14 October). */
const DEMO = {
  confirm: [
    { title: "Pharmacy", sub: "$12.75 · Sat 3 Oct · from a receipt", mark: "heart", tint: CATEGORY_TINT.health },
    { title: "Bookshop", sub: "$23.40 · Fri 2 Oct · from your mail", mark: "bag", tint: CATEGORY_TINT.shopping },
  ] as ConfirmRow[],
  coming: [
    { title: "Streaming", sub: "Due Fri 16 Oct", value: "$15.99" },
    { title: "Music", sub: "Due Mon 19 Oct", value: "$10.99" },
    { title: "Phone", sub: "Due Fri 23 Oct", value: "$75.00" },
  ] as BillRowProps[],
};

/**
 * Money's Overview (spending/overview.tsx): the page's name and its five
 * tabs, Overview chosen in Money's gold; the month (overview.tsx Month: its
 * name 13 soft, what was spent at 56 on 62 light, the line under it 15 soft,
 * the thirty dots 12 under that); "To confirm" with its count and the
 * spends waiting for a yes; "Coming up" with "Bills" and the bills still to
 * pay, each with its tick; Krovvi's bar over the foot.
 */
export function MoneyOverview({
  month = "October",
  spent = "$1,104",
  line = "$1,394 left after bills, about $77 a day",
  share = 1104 / 2600,
  held = 101.98 / 2600,
  confirm = DEMO.confirm,
  coming = DEMO.coming,
  tab = 0,
  sky,
  label,
  className,
  style,
}: Piece & {
  month?: string;
  /** What was spent this month, as the large figure says it. */
  spent?: string;
  /** The line under it (copy.ts monthLine). */
  line?: string;
  /** What was spent, as a share of the budget. */
  share?: number;
  /** The bills still due, as a share of the budget. */
  held?: number;
  confirm?: ConfirmRow[];
  coming?: BillRowProps[];
  /** The chosen tab: 0 Overview, 1 Spends, 2 Bills, 3 Trends, 4 Plan. */
  tab?: number;
  /** The stars along the top of the page. */
  sky?: ReactNode;
  label?: string;
}) {
  const width = 393 - 32 - 32;
  return (
    <AppPage title="Money" tabs={["Overview", "Spends", "Bills", "Trends", "Plan"]} tab={tab} tint={MONEY_TINT} sky={sky} label={label ?? `Money, ${month}: ${spent} spent. ${line}`} className={className} style={style}>
      <div style={{ ...PANE, padding: "16px 16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...FACE.label, color: C.soft }}>{month}</span>
          <span style={{ fontSize: 56, lineHeight: "62px", fontWeight: 300, letterSpacing: "-2.4px", color: C.fg, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{spent}</span>
          <span style={{ ...FACE.body, color: C.soft }}>{line}</span>
          <div style={{ marginTop: 12 }}>
            <DotBar share={share} held={held} tint={MONEY_TINT} width={width} />
          </div>
        </div>
      </div>
      {confirm.length ? (
        <>
          <GroupHead title="To confirm" value={String(confirm.length)} />
          <div style={PANE}>
            {confirm.map((row, i) => (
              <Row key={i} first={i === 0} lead={<IconTile mark={row.mark} tint={row.tint} />} title={row.title} sub={row.sub} trail={<Answers yes="Confirm" tint={MONEY_TINT} />} />
            ))}
          </div>
        </>
      ) : null}
      {coming.length ? (
        <>
          <GroupHead title="Coming up" action="Bills" />
          <div style={PANE}>
            {coming.map((row, i) => (
              <Row key={i} first={i === 0} title={row.title} sub={row.sub} value={row.value} trail={<Tick />} />
            ))}
          </div>
        </>
      ) : null}
    </AppPage>
  );
}
