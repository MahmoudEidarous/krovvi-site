import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

type Mark = "tap" | "play" | "check" | "no" | "trash" | "lines";

const ITEMS: Array<[Mark, string, string]> = [
  ["tap", "Nothing goes out without your tap.", "Every email, invite and shared list waits for you to say yes."],
  ["play", "Every line has a source.", "Tap it to hear the moment, or open the email it came from."],
  ["check", "Your corrections win.", "Fix something once, and Krovvi keeps it fixed."],
  ["lines", "Only what you pick is shared.", "The other person sees the lines you chose, never the recording."],
  ["no", "No ads. Never sold.", "Your data is never sold, and never used to train AI models."],
  ["trash", "Delete anything.", "A note, your voice sample, or your whole account, from Settings."],
];

function Glyph({ name }: { name: Mark }) {
  const p = { fill: "none", stroke: "#EDEDEB", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {name === "tap" && (
        <>
          <circle cx="11" cy="11" r="8.5" {...p} />
          <circle cx="11" cy="11" r="3" fill="#EDEDEB" />
        </>
      )}
      {name === "play" && (
        <>
          <circle cx="11" cy="11" r="8.5" {...p} />
          <path d="M9.2 7.6v6.8l5.4-3.4z" fill="#EDEDEB" />
        </>
      )}
      {name === "check" && (
        <>
          <circle cx="11" cy="11" r="8.5" {...p} />
          <path d="m7.3 11.2 2.6 2.6 4.9-5.4" {...p} />
        </>
      )}
      {name === "lines" && (
        <>
          <circle cx="5" cy="7" r="1.3" fill="#EDEDEB" />
          <circle cx="5" cy="11" r="1.3" fill="#EDEDEB" />
          <circle cx="5" cy="15" r="1.3" fill="#EDEDEB" />
          <path d="M8.5 7h9M8.5 11h9M8.5 15h6" {...p} />
        </>
      )}
      {name === "no" && (
        <>
          <circle cx="11" cy="11" r="8.5" {...p} />
          <path d="m5 5 12 12" {...p} />
        </>
      )}
      {name === "trash" && (
        <>
          <path d="M4 6.5h14M8.5 6.5V4.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3v1.7M6 6.5l.8 11c0 .6.6 1 1.2 1h6c.6 0 1.1-.4 1.2-1l.8-11" {...p} />
        </>
      )}
    </svg>
  );
}

export function Trust() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <div className="mx-auto max-w-[1120px]">
        <InView>
          <h2 className="anim max-w-[760px] text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]" style={an("k-rise-lg", 0, 1000)}>
            Your conversations stay yours.
          </h2>
        </InView>
        <InView className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(([g, t, b], i) => (
            <div key={t} className="anim" style={an("k-rise", i * 90, 800)}>
              <Glyph name={g} />
              <div className="mt-4 text-[19px] font-semibold tracking-[-0.015em]">{t}</div>
              <div className="mt-2 max-w-[320px] text-[16px] leading-[1.55] text-muted">{b}</div>
            </div>
          ))}
        </InView>
        <a href="/privacy" className="mt-12 inline-flex items-center gap-2 text-[16px] font-medium text-ink no-underline hover:underline">
          Read the privacy policy
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" />
          </svg>
        </a>
      </div>
    </section>
  );
}
