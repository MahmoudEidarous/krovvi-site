import { C, HAIR, THREAD_SIDE } from "@/components/deep";

/**
 * The top of the chat while a new person is Krovvi's guest, the first
 * meeting (catch8 src/components/first-meeting/guest-top.tsx at 6edb7fca):
 * the word Krovvi in its own dots in the middle of the bar, the quiet Sign in
 * at its trailing edge, and under the name the one line that says what
 * Krovvi is ("Krovvi is an AI. It prefers super friend.", lib/i18n.ts:4143).
 * Nothing else: the apps, the past chats and a new one arrive with the account.
 */

/** The word Krovvi in the brand's dots, in pitch units (lib/word-dots.ts). */
const WORD_DOTS: Array<[number, number]> = (() => {
  type Pts = Array<[number, number]>;
  const K: Pts = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
    [0.875, 1.375], [1.75, 0.75], [2.625, 0.125],
    [0.875, 2.625], [1.75, 3.25], [2.625, 3.875],
  ];
  const R: Pts = [[0, 1], [0, 2], [0, 3], [0, 4], [0.85, 1], [1.7, 1.2]];
  const O: Pts = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 10;
    return [1.5 + 1.5 * Math.cos(a), 2.5 - 1.5 * Math.sin(a)] as [number, number];
  });
  const V: Pts = [[0, 1], [0.42, 2], [0.83, 3], [1.25, 4], [1.67, 3], [2.08, 2], [2.5, 1]];
  const I: Pts = [[0, -0.3], [0, 1], [0, 2], [0, 3], [0, 4]];
  const letters: Array<[Pts, number]> = [[K, 0], [R, 3.825], [O, 6.725], [V, 10.925], [V, 14.425], [I, 18.125]];
  return letters.flatMap(([pts, dx]) => pts.map(([x, y]) => [x + dx, y] as [number, number]));
})();

/** The word's box in pitch units, with a dot's radius of air on every side (lib/word-dots.ts). */
const WORD_BOX = { x0: -0.6, y0: -0.85, w: 19.4, h: 5.4 } as const;

/** components/glyph.tsx:869-889 KrovviWord: each dot 0.8125 of the pitch across. */
export function KrovviWord({ pitch = 3.7, color = C.fg }: { pitch?: number; color?: string }) {
  const d = 0.8125 * pitch;
  return (
    <svg width={WORD_BOX.w * pitch} height={WORD_BOX.h * pitch} viewBox={`0 0 ${WORD_BOX.w * pitch} ${WORD_BOX.h * pitch}`} aria-hidden="true" style={{ display: "block" }}>
      {WORD_DOTS.map(([x, y], i) => (
        <circle key={i} cx={(x - WORD_BOX.x0) * pitch} cy={(y - WORD_BOX.y0) * pitch} r={d / 2} fill={color} />
      ))}
    </svg>
  );
}

/**
 * The bar (52 points: a row of 40 and its 12 point foot, as the chat's own
 * bar), the name over the middle of the row, Sign in on its trailing edge
 * (sign-in-card.tsx:167-168: 40 tall, 4 at the sides, 15 point medium in the
 * soft ink), then the quiet line tucked under the name, inside the bar's foot
 * (guest-top.tsx:76-77: 8 up into it, 8 under, 12 on 16 in the faint ink).
 */
export function GuestTop() {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ position: "relative", height: 52, padding: `0 ${THREAD_SIDE}px 12px`, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Krovvi">
          <KrovviWord />
        </div>
        <span style={{ position: "relative", height: 40, padding: "0 4px", display: "flex", alignItems: "center", color: C.soft, fontSize: 15, fontWeight: 500, letterSpacing: "-0.2px" }}>Sign in</span>
      </div>
      <div style={{ marginTop: -8, padding: "0 24px 8px", textAlign: "center", color: C.faint, fontSize: 12, lineHeight: "16px" }}>
        Krovvi is an AI. It prefers super friend.
      </div>
    </div>
  );
}

/** A message taken back, as every chat marks one: a ring with a stroke through it (first-meeting/opening.tsx:166-183). */
function Struck() {
  return (
    <span style={{ position: "relative", width: 14, height: 14, borderRadius: 7, border: `1.4px solid ${C.faint}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
      <span style={{ width: 11, height: 1.4, borderRadius: 1, background: C.faint, transform: "rotate(45deg)" }} />
    </span>
  );
}

/**
 * What is left of a greeting Krovvi took back (opening.tsx:139-150, 172-176):
 * the ring, then "Krovvi deleted this message" a step smaller and fainter than
 * a line that was said, slanted, on the said line's own line height, so the
 * bubble keeps its height as its words turn into the mark.
 */
export function DeletedMark({ fresh = false }: { fresh?: boolean }) {
  return (
    <span className={fresh ? "dk-fade" : undefined} style={{ display: "flex", alignItems: "center", gap: 7, ...({ "--dk-dur": "220ms" } as React.CSSProperties) }}>
      <Struck />
      <span style={{ color: C.faint, fontSize: 15.5, lineHeight: "25px", fontStyle: "italic", letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>Krovvi deleted this message</span>
    </span>
  );
}

/** Krovvi's glass bubble around anything (answer/reply.tsx StillBubble, theme/pane.ts sky): the first chat's greetings wear it. */
export function StillBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "82%", background: C.glass, border: `${HAIR}px solid ${C.glassEdge}`, borderRadius: 20, padding: "7px 14px 8px", color: C.fg, fontSize: 17, lineHeight: "25px", letterSpacing: "-0.2px" }}>
      {children}
    </div>
  );
}
