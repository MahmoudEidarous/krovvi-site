import { PersonFace, personTint } from "@/components/app/ui";

/**
 * How people really talk, and what Krovvi keeps from it. Each line is said
 * by someone in your life (or by you), in their own loose words; the part
 * Krovvi caught is lit and marked in that person's colour, with what it
 * filed it as. Two rows drift past in opposite directions.
 */
type Said = { who: string; name?: string; before: string; caught: string; after: string; kind: string };

const THEM: Said[] = [
  { who: "Sara Ali", before: "Can you get me ", caught: "the new deck by Friday", after: "?", kind: "Task" },
  { who: "Karim Nabil", before: "Let's say ", caught: "forty-two, half now", after: " and half when it's done.", kind: "Money" },
  { who: "Mom", before: "Come ", caught: "Sunday at 7", after: ", I'm making your favorite.", kind: "Date" },
  { who: "Lina", before: "I'll ", caught: "take the kids Wednesday", after: ", you have the weekend.", kind: "Task" },
  { who: "Omar", before: "You have to try ", caught: "Sora on 9th Street", after: ".", kind: "Noted" },
  { who: "Mona", before: "So the launch is still ", caught: "October 3", after: ", right?", kind: "Old date" },
];

const YOU: Said[] = [
  { who: "You", before: "I'll ", caught: "send you the signed quote on Monday", after: ".", kind: "Task" },
  { who: "You", before: "Okay, ", caught: "we go with the second design", after: ".", kind: "Decision" },
  { who: "You", before: "Remind me to ", caught: "call the landlord", after: " about the heater.", kind: "Task" },
  { who: "You", before: "The dentist moved to ", caught: "Friday at 10", after: ".", kind: "Date" },
  { who: "You", before: "We split summer camp, ", caught: "600 each", after: ".", kind: "Money" },
  { who: "You", before: "I want to ", caught: "lead a team", after: " next year.", kind: "Goal" },
];

/** A hex ink at a given strength, for the underline under what was caught. */
function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function Line({ s }: { s: Said }) {
  const tint = personTint(s.who);
  const first = s.who.split(" ")[0];
  return (
    <span className="flex shrink-0 items-center gap-[14px] whitespace-nowrap">
      {s.who === "You" ? (
        <span className="text-[13px] font-semibold text-soft">You</span>
      ) : (
        <>
          <PersonFace name={s.who} size={30} />
          <span className="text-[13px] font-semibold" style={{ color: tint }}>
            {first}
          </span>
        </>
      )}
      <span className="text-[clamp(19px,2.2vw,27px)] font-medium tracking-[-0.02em] text-muted">
        “{s.before}
        <span
          className="text-ink"
          style={{
            backgroundImage: `linear-gradient(transparent 56%, ${alpha(s.who === "You" ? "#EDEDEB" : tint, s.who === "You" ? 0.14 : 0.26)} 56%, ${alpha(s.who === "You" ? "#EDEDEB" : tint, s.who === "You" ? 0.14 : 0.26)} 94%, transparent 94%)`,
            borderRadius: 3,
            padding: "0 2px",
            margin: "0 -2px",
          }}
        >
          {s.caught}
        </span>
        {s.after}”
      </span>
      <span className="rounded-full bg-card px-[10px] py-[4px] text-[12px] font-medium text-soft">{s.kind}</span>
    </span>
  );
}

function Row({ items, seconds, reverse = false }: { items: Said[]; seconds: number; reverse?: boolean }) {
  // Two copies side by side, moved by exactly one copy's width, loop without a seam.
  return (
    <div className="flex overflow-hidden">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="ticker flex shrink-0 items-center gap-16 pr-16"
          style={{ animation: `${reverse ? "k-ticker-back" : "k-ticker"} ${seconds}s linear infinite` }}
        >
          {items.map((s) => (
            <Line key={s.caught} s={s} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <section aria-label="How people really talk, and what Krovvi keeps from it" className="relative pb-6">
      <div className="mb-8 px-5 text-center text-[14px] text-faint">How people really talk, and what Krovvi keeps.</div>
      <div
        className="flex flex-col gap-7"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <Row items={THEM} seconds={95} />
        <Row items={YOU} seconds={110} reverse />
      </div>
    </section>
  );
}
