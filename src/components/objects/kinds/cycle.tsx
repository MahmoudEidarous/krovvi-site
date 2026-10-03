"use client";

/**
 * Cycle on the page, the most private kind: whoever opens the link holds the
 * phase and the next estimate and nothing else (the core's shareSnap makes
 * them one estimate item), so this draws exactly that, as the app draws a
 * partner's screen (catch8 src/components/objects/kinds/cycle): the phase in
 * display type, the estimate called an estimate, and a dot for each day until
 * it. No ring, no dates gone by, no log, and nothing to tap.
 */

import { say, type Words } from "@/lib/objects";
import { DotLine, INK, STEP } from "../kit";
import type { KindPage } from "../types";

/** The view as the core sends it to anyone but the owner (catch8 supabase/functions/_shared/objects/kinds/cycle.ts CycleView). */
interface CycleView {
  phase: "period" | "between" | "soon" | "late" | "unknown";
  phaseWords: Words;
  next: { day: string; inDays: number; words: Words } | null;
}

const C = {
  legend: { en: "Each dot is a day until the estimate.", ar: "كل نقطة يوم لحد التقدير." },
  shared: { en: "Shared with you to look at.", ar: "متشاركة معاك عشان تشوفها بس." },
} satisfies Record<string, Words>;

export const Page: KindPage = ({ view, lang }) => {
  const v = view as CycleView;
  const days = v.next ? Math.max(0, Math.min(v.next.inDays, 35)) : 0;
  return (
    <section className="mb-3 flex flex-col items-center text-center" style={{ background: INK.surface, borderRadius: 17, padding: "24px 16px", gap: 14 }} aria-label={`${say(v.phaseWords, lang)}. ${v.next ? say(v.next.words, lang) : ""}`}>
      <span style={{ ...STEP.display, fontSize: 32, lineHeight: "38px" }}>{say(v.phaseWords, lang)}</span>
      {v.next ? <span style={{ ...STEP.body, color: INK.soft }}>{say(v.next.words, lang)}</span> : null}
      {days ? (
        <>
          <DotLine dots={Array.from({ length: days }, () => ({ on: true, tint: INK.soft }))} dot={9} gap={6} />
          <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.legend, lang)}</span>
        </>
      ) : null}
      <span style={{ ...STEP.meta, color: INK.muted }}>{say(C.shared, lang)}</span>
    </section>
  );
};
