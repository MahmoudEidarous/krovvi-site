import { an } from "@/lib/anim";
import { AppIcon, Card, Check, PersonFace, Play } from "./ui";

/* ── It remembers: a moment played back, the words arriving with the sound ── */

const WAVE = Array.from({ length: 76 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.7) * 0.55 + Math.sin(i * 0.37) * 0.35 + Math.sin(i * 4.1) * 0.18);
  return Math.max(0.12, Math.min(1, v));
});

export function RememberVisual() {
  const quote = "“I'll get you the signed quote on Monday.”".split(" ");
  const play = 3200;
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="rounded-[22px] bg-ground p-5">
        <div className="flex items-center gap-3">
          <PersonFace name="Karim Nabil" size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink">Karim Nabil</div>
            <div className="text-[12.5px] text-faint">Meeting with Karim · Monday</div>
          </div>
          <span className="flex items-center gap-[6px] rounded-full bg-card-hi px-[10px] py-[5px] text-[12.5px] text-ink tabular">
            <Play size={7} /> 3:12
          </span>
        </div>
        {/* The sound: grey until it is heard, then ivory as the moment plays. */}
        <div className="relative mt-5 h-[58px]">
          <Bars tone="#33332f" />
          <div className="anim absolute inset-0" style={an("k-reveal-x", 500, play, { animationTimingFunction: "linear" })}>
            <Bars tone="#EDEDEB" />
          </div>
        </div>
        <div className="mt-5 text-[clamp(18px,2vw,22px)] font-medium leading-[1.35] tracking-[-0.02em] text-ink">
          {quote.map((w, i) => (
            <span key={i} className="anim" style={an("k-fade", 700 + (i * play) / quote.length, 300)}>
              {w}{" "}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="px-1 text-[13px] font-semibold text-muted">What I caught</div>
        {[
          ["Task", "Karim: Send the signed quote", "Due Monday", "3:12"],
          ["Decision", "Half up front, half when it's done", "", "5:40"],
          ["Money", "The total stays at 42,000", "", "6:02"],
          ["Date", "Install starts on the 5th", "", "8:47"],
        ].map(([kind, text, sub, at], i) => (
          <div
            key={kind}
            className="anim flex items-start gap-3 rounded-[16px] bg-ground px-4 py-3"
            style={an("k-rise", 900 + i * 380, 700)}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-faint">{kind}</div>
              <div className="text-[14.5px] leading-[1.35] text-soft">{text}</div>
              {sub && <div className="mt-[2px] text-[12.5px] text-muted">{sub}</div>}
            </div>
            <span className="mt-[10px] flex items-center gap-[5px] text-[12px] text-faint tabular">
              <Play size={6} /> {at}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ tone }: { tone: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-between">
      {WAVE.map((h, i) => (
        <span key={i} className="block w-[3px] rounded-[2px]" style={{ height: `${h * 100}%`, background: tone }} />
      ))}
    </div>
  );
}

/* ── It knows who matters: your people, closest first, with twelve weeks of talk ── */

const PEOPLE: Array<{ letter: string; ink: string; name: string; line: string; last: string }> = [
  { letter: "S", ink: "var(--sand)", name: "Sara Ali", line: "Waiting on your new deck", last: "Tuesday" },
  { letter: "M", ink: "var(--bone)", name: "Mom", line: "Dinner on Sunday at 7", last: "Saturday" },
  { letter: "K", ink: "var(--clay)", name: "Karim Nabil", line: "You owe him the signed quote", last: "Monday" },
  { letter: "L", ink: "var(--brass)", name: "Lina", line: "Has the kids on Wednesday", last: "Monday" },
  { letter: "O", ink: "var(--ash)", name: "Omar", line: "Review on Thursday at 10", last: "Last week" },
];

export function PeopleVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[22px] bg-ground p-4 md:p-5">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-[13px] font-semibold text-muted">Closest now</span>
          <span className="text-[12px] text-faint">Last talked</span>
        </div>
        <div className="mt-2 flex flex-col">
          {PEOPLE.map((p, i) => (
            <div
              key={p.name}
              className="anim flex items-center gap-3 border-t border-line/70 py-[12px] first:border-t-0"
              style={an("k-rise", 200 + i * 160, 700)}
            >
              <PersonFace name={p.name} size={38} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                <div className="text-[13px] leading-[1.4] text-muted">{p.line}</div>
              </div>
              <span className="shrink-0 text-[12.5px] text-faint">{p.last}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="anim rounded-[22px] bg-ground p-5" style={an("k-rise", 1500, 800)}>
        <div className="flex items-center gap-3">
          <PersonFace name="Sara Ali" size={34} />
          <div>
            <div className="text-[15px] font-semibold text-ink">Where things stand with Sara</div>
            <div className="text-[12.5px] text-faint">Before your 6:17 meeting</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[96px_1fr] gap-y-[10px] text-[14px]">
          <span className="text-faint">You owe</span>
          <span className="text-ink">The new deck, by Friday</span>
          <span className="text-faint">Sara owes</span>
          <span className="text-ink">The final copy, by Sunday</span>
          <span className="text-faint">Worth knowing</span>
          <span className="text-ink">She&apos;s moving to Dubai in November</span>
        </div>
      </div>
    </div>
  );
}

/* ── It understands you: Krovvi's read on you, every line yours to change ── */

export function ReadOnYouVisual() {
  const groups: Array<[string, string[]]> = [
    ["Working toward", ["A 10K in December", "Moving into the new apartment"]],
    ["On your mind", ["The Atlas launch", "Your mom's birthday on the 20th"]],
    ["How you like things", ["Short answers, no lists", "The answer first, details after"]],
  ];
  return (
    <div className="rounded-[22px] bg-ground p-5">
      <div className="text-[13px] font-semibold text-muted">Krovvi&apos;s read on you</div>
      <div className="mt-4 flex flex-col gap-4">
        {groups.map(([label, lines], g) => (
          <div key={label} className="anim" style={an("k-rise", 200 + g * 220, 700)}>
            <div className="text-[12px] font-medium text-faint">{label}</div>
            {lines.map((l) => (
              <div key={l} className="mt-[3px] text-[15px] text-ink">
                {l}
              </div>
            ))}
            {g === 2 && (
              <div className="anim mt-3 flex flex-wrap gap-[6px]" style={an("k-pop", 1500, 500)}>
                {["Still true", "Change", "Outdated"].map((pill, k) => (
                  <span
                    key={pill}
                    className={`seq rounded-full px-[11px] py-[5px] text-[12.5px] font-medium ${k === 0 ? "bg-ink text-ground" : "bg-card-hi text-ink"}`}
                    style={k === 0 ? { animation: "k-press 420ms var(--ease) 2300ms both" } : undefined}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── It keeps up: what changed, and who still has the old version ── */

export function ChangedVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[22px] bg-ground p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted">What changed</span>
          <span className="flex h-[28px] items-center gap-[6px] rounded-full bg-card-hi px-[11px] text-[13px] font-medium text-ink">Undo</span>
        </div>
        <div className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-ink">The Atlas launch</div>
        <div className="mt-3 grid grid-cols-[48px_1fr] items-baseline gap-y-2 text-[15px]">
          <span className="text-[12.5px] text-faint">Was</span>
          <span className="relative w-fit text-muted">
            October 3
            <span className="anim absolute left-0 right-0 top-1/2 h-[1.5px] origin-left bg-soft" style={an("k-strike", 700, 600)} />
          </span>
          <span className="text-[12.5px] text-faint">Now</span>
          <span className="anim w-fit font-semibold text-ink" style={an("k-pop", 1200, 500)}>October 15</span>
        </div>
        <div className="mt-3 flex items-center gap-[6px] text-[12.5px] text-faint">
          <Play size={6} /> Heard in Atlas sync · Tuesday
        </div>
      </div>
      <div className="anim rounded-[22px] bg-ground p-5" style={an("k-rise", 1700, 700)}>
        <div className="flex items-center gap-3">
          <PersonFace name="Mona" size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink">Mona still has the old date</div>
            <div className="text-[13px] text-muted">You told her October 3, last week</div>
          </div>
        </div>
        <span className="anim mt-3 inline-block rounded-full bg-ink px-[16px] py-[7px] text-[14px] font-semibold text-ground" style={an("k-pop", 2200, 500)}>
          Tell Mona
        </span>
      </div>
    </div>
  );
}

/* ── It speaks up at the right moment, and only then ── */

export function SpeakUpVisual() {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-4 pb-5 pt-6"
      style={{ background: "radial-gradient(120% 80% at 30% 0%, #2a2420 0%, #141211 55%, #0a0a0a 100%)" }}
    >
      <div className="text-center">
        <div className="text-[13px] font-semibold text-ink/80">Thursday 1 October</div>
        <div className="text-[58px] font-semibold leading-none tracking-[-2px] text-ink/95 tabular">6:07</div>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <div className="anim" style={an("k-drop", 600, 800)}>
          <LockNote title="Seeing Sara at 6:17 PM" body="You owe: the new deck with the updated numbers." />
        </div>
        <div className="anim opacity-70" style={an("k-drop", 1800, 800)}>
          <LockNote title="Send Karim the signed quote" body="Due today · Your task for Karim" when="9:00" />
        </div>
      </div>
    </div>
  );
}

function LockNote({ title, body, when = "now" }: { title: string; body: string; when?: string }) {
  return (
    <div className="rounded-[18px] bg-[rgba(52,50,48,0.72)] px-3 py-[10px] backdrop-blur-xl">
      <div className="flex items-start gap-[10px]">
        <span className="mt-[1px] shrink-0">
          <AppIcon size={32} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13.5px] font-semibold text-ink">{title}</span>
            <span className="text-[12px] text-ink/50">{when}</span>
          </div>
          <div className="text-[13.5px] leading-[1.3] text-ink/85">{body}</div>
        </div>
      </div>
    </div>
  );
}

/* ── It does the next step, with your OK ── */

export function NextStepVisual() {
  const body = "Hi Karim, here is the signed quote: 42,000 in total, half up front and half when it's done. Thanks, Sam".split(" ");
  const seq = (steps: string) => ({ animation: steps });
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Card className="bg-ground px-5 py-5">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold text-ink">Before it sends</span>
          <span className="text-faint">Valid for 30 minutes</span>
        </div>
        <div className="mt-3 grid grid-cols-[62px_1fr] gap-y-[4px] text-[14px]">
          <span className="text-faint">To</span>
          <span className="text-soft">Karim Nabil</span>
          <span className="text-faint">Subject</span>
          <span className="font-semibold text-ink">The signed quote</span>
        </div>
        <div className="mt-3 min-h-[66px] text-[14.5px] leading-[1.5] text-soft">
          {body.map((w, i) => (
            <span key={i} className="anim" style={an("k-fade", 400 + i * 55, 250)}>
              {w}{" "}
            </span>
          ))}
        </div>
        <div className="relative mt-4 h-[36px]">
          <div className="seq transient absolute inset-0 flex items-center gap-[14px]" style={seq("k-gone 250ms var(--ease) 2900ms forwards")}>
            <span className="seq rounded-full bg-ink px-[18px] py-[8px] text-[14.5px] font-semibold text-ground" style={seq("k-press 420ms var(--ease) 2400ms both")}>
              Send it
            </span>
            <span className="text-[14.5px] font-medium text-soft">Change it</span>
          </div>
          <div className="seq absolute inset-0 flex items-center gap-[10px] text-[15px] font-semibold text-ink" style={seq("k-pop 450ms var(--ease) 3100ms both")}>
            <Check done /> Sent to Karim
          </div>
        </div>
      </Card>
      <div className="flex flex-col gap-2">
        <div className="px-1 text-[13px] font-semibold text-muted">Tasks</div>
        <Card className="bg-ground">
          <div className="flex items-start gap-[14px] px-[16px] py-[13px]">
            <span className="relative mt-[1px] h-[24px] w-[24px] shrink-0">
              <span className="absolute inset-0"><Check /></span>
              <span className="anim absolute inset-0" style={an("k-check-in", 3600, 500)}><Check done /></span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="anim text-[15.5px] leading-[1.35] line-through decoration-[1.5px]" style={an("k-done-text", 3800, 700)}>
                Send Karim the signed quote
              </div>
              <div className="mt-[4px] flex items-center gap-[6px] text-[13px] text-faint">
                <Play size={6} /> said Monday, in a meeting
              </div>
            </div>
          </div>
        </Card>
        <div className="anim flex items-center justify-between rounded-[14px] bg-ground px-[14px] py-[10px]" style={an("k-pop", 4300, 600)}>
          <span className="text-[13.5px] text-soft">Closed: you sent it at 9:12</span>
          <span className="rounded-full bg-card-hi px-[11px] py-[4px] text-[12.5px] font-medium text-ink">Undo</span>
        </div>
      </div>
    </div>
  );
}
