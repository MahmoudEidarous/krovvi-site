import { PersonFace, personTint } from "@/components/app/ui";

/**
 * What people say, and what Krovvi understands from it. Each line is said
 * loosely, the way people talk; after the arrow is what Krovvi worked out,
 * which nobody said outright, with the kind of thing it is (the app's own
 * words: Still deciding, Decided, On your mind, A goal, Worth knowing).
 * Two rows drift past in opposite directions.
 */
type Read = { who: string; said: string; means: string; kind: string };

const THEM: Read[] = [
  { who: "Karim Nabil", said: "We start the day the deposit clears.", means: "The kitchen waits on your deposit", kind: "Waiting on you" },
  { who: "Sara Ali", said: "Let's see what the board says first.", means: "The launch date isn't final yet", kind: "Still deciding" },
  { who: "Mom", said: "Your father hasn't been himself since the surgery.", means: "Worth checking in on your dad", kind: "Worth knowing" },
  { who: "Omar", said: "I'm half thinking of leaving Atlas.", means: "Omar may be leaving Atlas", kind: "Worth knowing" },
  { who: "Lina", said: "The kids won't stop talking about the trip.", means: "The trip matters to the kids", kind: "Noticed" },
];

const YOU: Read[] = [
  { who: "You", said: "I'm so done with this commute.", means: "The third time you've said it this month", kind: "On your mind" },
  { who: "You", said: "If he asks for more than 45, we walk.", means: "Your limit with Karim is 45,000", kind: "Decided" },
  { who: "You", said: "I'll deal with the landlord after the launch.", means: "The heater waits until after October 15", kind: "Waiting" },
  { who: "You", said: "I really want to run a 10K before the year's out.", means: "Run a 10K by December", kind: "A goal" },
];

function Line({ r }: { r: Read }) {
  const you = r.who === "You";
  return (
    <span className="flex shrink-0 items-center gap-[14px] whitespace-nowrap">
      {you ? (
        <span className="text-[13px] font-semibold text-soft">You</span>
      ) : (
        <>
          <PersonFace name={r.who} size={30} />
          <span className="text-[13px] font-semibold" style={{ color: personTint(r.who) }}>
            {r.who.split(" ")[0]}
          </span>
        </>
      )}
      <span className="text-[clamp(18px,2vw,24px)] font-medium tracking-[-0.02em] text-muted">“{r.said}”</span>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="#7A7A74" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 6h19M15 1l5 5-5 5" />
      </svg>
      <span className="text-[clamp(18px,2vw,24px)] font-semibold tracking-[-0.02em] text-ink">{r.means}</span>
      <span className="rounded-full bg-card px-[10px] py-[4px] text-[12px] font-medium text-soft">{r.kind}</span>
    </span>
  );
}

function Row({ items, seconds, reverse = false }: { items: Read[]; seconds: number; reverse?: boolean }) {
  // Two copies side by side, moved by exactly one copy's width, loop without a seam.
  return (
    <div className="flex overflow-hidden">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="ticker flex shrink-0 items-center gap-20 pr-20"
          style={{ animation: `${reverse ? "k-ticker-back" : "k-ticker"} ${seconds}s linear infinite` }}
        >
          {items.map((r) => (
            <Line key={r.said} r={r} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <section aria-label="What people say, and what Krovvi understands from it" className="relative pb-6">
      <div className="mb-8 px-5 text-center text-[14px] text-faint">What people say, and what Krovvi understands.</div>
      <div
        className="flex flex-col gap-7"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <Row items={THEM} seconds={110} />
        <Row items={YOU} seconds={120} reverse />
      </div>
    </section>
  );
}
