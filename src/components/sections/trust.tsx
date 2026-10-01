import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/**
 * Trust, said plainly and shown with the app's own controls inside the
 * sentence: the white Send it that waits for your tap, a source you can
 * play, the Undo on every change. Each one moves once in a while, as if
 * someone were using it. The smaller promises sit underneath.
 */

/** The app's one white control: a pill that waits for your tap. */
function SendPill() {
  return (
    <span className="relative mx-[0.08em] inline-flex align-middle" aria-hidden="true">
      <span
        className="mark-loop pointer-events-none absolute inset-0 rounded-full border border-ink/40 opacity-0"
        style={{ animation: "k-ripple 3.6s var(--ease) 1.2s infinite both" }}
      />
      <span
        className="mark-loop relative inline-flex h-[2.05em] items-center rounded-full bg-ink px-[1.15em] text-[0.46em] font-semibold tracking-[-0.02em] text-ground"
        style={{ animation: "k-tap 3.6s var(--ease) 1.2s infinite both" }}
      >
        Send it
      </span>
    </span>
  );
}

/** A moment cited: play, where it was said and the second, playing through. */
function SourcePill() {
  return (
    <span
      className="relative mx-[0.08em] inline-flex h-[2.05em] items-center gap-[0.55em] overflow-hidden rounded-full bg-card-hi pl-[0.85em] pr-[1em] align-middle text-[0.46em] font-medium tracking-[-0.01em]"
      aria-hidden="true"
    >
      <span
        className="mark-loop absolute inset-y-0 left-0 w-full origin-left bg-white/[0.06]"
        style={{ animation: "k-play-through 4.8s linear 0.6s infinite both" }}
      />
      <span
        className="relative h-0 w-0"
        style={{ borderTop: "0.36em solid transparent", borderBottom: "0.36em solid transparent", borderLeft: "0.6em solid #A9A8A2" }}
      />
      <span className="relative whitespace-nowrap text-soft">Meeting with Karim</span>
      <span className="relative text-faint tabular">3:12</span>
    </span>
  );
}

/** The Undo that comes with every change Krovvi makes. */
function UndoPill() {
  return (
    <span
      className="mark-loop mx-[0.08em] inline-flex h-[2.05em] items-center gap-[0.45em] rounded-full bg-card-hi px-[1em] align-middle text-[0.46em] font-medium text-ink"
      style={{ animation: "k-tap 4.4s var(--ease) 2.4s infinite both" }}
      aria-hidden="true"
    >
      <svg width="0.95em" height="0.85em" viewBox="0 0 14 12" fill="none" stroke="#A9A8A2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 1 1.5 4l3 3" />
        <path d="M1.8 4h6.7a4 4 0 0 1 0 8H5" />
      </svg>
      Undo
    </span>
  );
}

const SMALL = [
  "Only the lines you choose are ever shared, never the recording.",
  "Delete a note, your voice sample or your whole account, any time.",
  "No ads. Your data is never sold.",
];

export function Trust() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto max-w-[1100px]">
        <h2
          className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
          style={an("k-rise-lg", 0, 1000)}
        >
          Your conversations stay yours.
        </h2>
        <p
          className="anim mt-10 max-w-[1000px] text-pretty text-[clamp(26px,3.3vw,42px)] font-semibold leading-[1.5] tracking-[-0.03em] text-ink"
          style={an("k-rise", 200, 1000)}
        >
          Nothing goes out until you tap <SendPill />. Every answer shows where it came from <SourcePill />. Every change
          it makes comes with <UndoPill />. And your data is never used to train AI.
        </p>
        <div className="anim mt-14 grid gap-x-10 gap-y-3 md:grid-cols-3" style={an("k-fade", 500, 900)}>
          {SMALL.map((line) => (
            <p key={line} className="text-pretty text-[15.5px] leading-[1.55] text-muted">
              {line}
            </p>
          ))}
        </div>
        <a
          href="/privacy"
          className="anim mt-10 inline-flex items-center gap-2 text-[16px] font-medium text-ink no-underline hover:underline"
          style={an("k-fade", 650, 900)}
        >
          Read the privacy policy
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 7h10M8 3l4 4-4 4" />
          </svg>
        </a>
      </InView>
    </section>
  );
}
