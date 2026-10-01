import type { CSSProperties } from "react";

import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";
import { AppIcon, KGlyph, PersonFace, personTint, StatusBar } from "./ui";

/**
 * The six things having Krovvi means, each shown as the moment it happens in
 * the app and worded the way the app words it (catch8 lib/i18n.ts,
 * components/understood.tsx, app/person/[id].tsx; docs/app-visual-spec.md).
 */

const seq = (animation: string): CSSProperties => ({ animation });

/** The play mark the app puts beside a moment: a small solid triangle. */
function Tri({ color = "#7A7A74" }: { color?: string }) {
  return <span className="h-0 w-0 shrink-0" style={{ borderTop: "3.5px solid transparent", borderBottom: "3.5px solid transparent", borderLeft: `6px solid ${color}` }} />;
}

/* ── A. It remembers exactly what was said ─────────────────────────────── */

const WAVE = Array.from({ length: 64 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.7) * 0.55 + Math.sin(i * 0.37) * 0.35 + Math.sin(i * 4.1) * 0.18);
  return Math.max(0.14, Math.min(1, v));
});

function Bars({ tone }: { tone: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-between">
      {WAVE.map((h, i) => (
        <span key={i} className="block w-[3px] rounded-full" style={{ height: `${h * 100}%`, background: tone }} />
      ))}
    </div>
  );
}

const SAID = "Forty-two in total. Half now, and half when it's done.".split(" ");

const CAUGHT: Array<{ kind: string; lead?: string; text: string; at: string; due?: string; playing?: boolean }> = [
  { kind: "Money", lead: "42,000", text: " in total, not the 46,000 in the quote", at: "12:08", playing: true },
  { kind: "Decision", text: "Half up front, half when the kitchen is done", at: "12:11" },
  { kind: "Task", lead: "You owe Karim", text: ": the signed quote", at: "3:12", due: "Monday" },
  { kind: "Date", text: "Work starts on the 5th", at: "8:47" },
];

export function RememberVisual() {
  const begin = 700; // the moment starts playing
  const play = 2800; // and plays this long
  const tint = personTint("Karim Nabil");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* The moment, playing: the sound lights as it is heard, and the words light with it. */}
      <div className="flex flex-col rounded-[22px] bg-ground p-5">
        <div className="flex items-center gap-3">
          <PersonFace name="Karim Nabil" size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold tracking-[-0.2px] text-ink">Kitchen walkthrough</div>
            <div className="text-[12.5px] text-faint">With Karim Nabil · Monday</div>
          </div>
        </div>
        <div className="relative mt-5 h-[48px]">
          <Bars tone="#33332f" />
          <div className="anim absolute inset-0" style={an("k-reveal-x", begin, play, { animationTimingFunction: "linear" })}>
            <Bars tone="#EDEDEB" />
          </div>
        </div>
        <div className="mt-5">
          <div className="text-[12.5px] font-semibold" style={{ color: tint }}>
            Karim
          </div>
          <div className="mt-1 text-[clamp(19px,1.9vw,23px)] font-medium leading-[1.35] tracking-[-0.02em] text-ink">
            {SAID.map((w, i) => (
              <span key={i} className="anim" style={an("k-ink", begin + (i * play) / SAID.length, 260)}>
                {w}{" "}
              </span>
            ))}
          </div>
        </div>
        {/* The player: playing from 12:08 of a 31-minute walkthrough. */}
        <div className="mt-auto flex items-center gap-[10px] pt-5">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-ink">
            <svg width="9" height="10" viewBox="0 0 12 14" aria-hidden="true">
              <rect x="1" y="1" width="3.4" height="12" rx="1.2" fill="#0A0A0A" />
              <rect x="7.6" y="1" width="3.4" height="12" rx="1.2" fill="#0A0A0A" />
            </svg>
          </span>
          <span className="relative w-[38px] text-[12px] text-ink tabular">
            <span style={{ animation: `k-hide 1ms linear ${begin + play / 2}ms forwards` }}>12:08</span>
            <span className="absolute left-0 top-0" style={{ animation: `k-show 1ms linear ${begin + play / 2}ms both` }}>
              12:11
            </span>
          </span>
          <span className="relative h-[3px] flex-1 rounded-full bg-line">
            <span className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-soft" />
          </span>
          <span className="text-[12px] text-faint tabular">31:40</span>
        </div>
      </div>

      {/* What Krovvi caught from that conversation, as the app shows it; the line being played is lit. */}
      <div className="flex flex-col">
        <div className="px-1 text-[12px] uppercase tracking-[1.1px] text-faint">What I caught</div>
        <div className="mt-2 overflow-hidden rounded-[17px] bg-ground">
          {CAUGHT.map((line, i) => (
            <div key={line.kind} className="anim" style={an("k-rise", 300 + i * 160, 650)}>
              {i > 0 && <div className="mx-4 h-px bg-line" />}
              <div
                className="seq flex flex-col gap-[4px] px-4 pb-[9px] pt-[11px]"
                style={line.playing ? seq(`k-lit ${play}ms linear ${begin}ms`) : undefined}
              >
                <div className="text-[11px] font-semibold tracking-[0.4px] text-faint">{line.kind}</div>
                <div className="text-[14.5px] leading-[1.42] tracking-[-0.15px] text-soft">
                  {line.lead && <b className="font-semibold text-ink">{line.lead}</b>}
                  {line.text}
                </div>
                <div className="flex items-center gap-[8px] text-[12px] text-faint tabular">
                  <span className="flex items-center gap-[5px]">
                    <Tri color={line.playing ? "#EDEDEB" : "#7A7A74"} />
                    <span className={line.playing ? "text-ink" : ""}>{line.at}</span>
                  </span>
                  {line.due && <span className="text-soft">Due {line.due}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── B. It knows the people in your life: Sara's page, as the app shows it ── */

/** Twenty-six weeks of talk, oldest on the left: the app's rhythm, in its four inks. */
const RHYTHM = [0, 1, 0, 0, 1, 1, 0, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 3, 2, 2, 3, 2, 3, 3, 2, 3];
const RHYTHM_INK = ["#2A2A28", "#5A5955", "#A9A8A2", "#EDEDEB"];

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between px-[4px] pb-[10px] pt-[22px]">
      <span className="text-[13px] font-semibold text-muted">{title}</span>
      {note && <span className="text-[12.5px] text-soft">{note}</span>}
    </div>
  );
}

function PersonScreen() {
  const stand: Array<[string, string]> = [
    ["The Atlas launch moved to October 15", "Tue"],
    ["She owns the final copy for the landing page", "Tue"],
    ["She's moving to Dubai in November", "Sun"],
  ];
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[63px] flex justify-between">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card">
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="#EDEDEB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6.5 1.5 1.5 6.5l5 5" />
          </svg>
        </span>
        <span className="flex h-[34px] w-[34px] items-center justify-center gap-[3px] rounded-full bg-card">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[3.5px] w-[3.5px] rounded-[2px] bg-ink" />
          ))}
        </span>
      </div>

      <div className="absolute inset-x-[16px] top-[105px]">
        <div className="flex flex-col gap-[12px] px-[4px] pt-[4px]">
          <PersonFace name="Sara Ali" size={68} />
          <div className="mt-[2px]">
            <div className="text-[28px] font-bold leading-[33px] tracking-[-0.9px] text-ink">Sara Ali</div>
            <div className="mt-[2px] text-[15px] tracking-[-0.15px] text-soft">Head of design at Atlas</div>
          </div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex gap-[4.6px]">
              {RHYTHM.map((level, i) => (
                <span
                  key={i}
                  className="anim h-[7px] w-[7px] rounded-full"
                  style={{ ...an("k-fade", 200 + i * 28, 300), background: RHYTHM_INK[level] }}
                />
              ))}
            </div>
            <div className="text-[12.5px] leading-[17px] text-faint">38 talks since March · last Tuesday · 12 emails</div>
          </div>
        </div>

        <div className="flex gap-[8px] px-[4px] pt-[16px]">
          <span className="flex h-[36px] items-center gap-[7px] rounded-[18px] bg-ink px-[15px] text-[14px] font-semibold text-ground">
            <KGlyph size={12} color="#0A0A0A" /> Ask about Sara
          </span>
          <span className="flex h-[36px] items-center gap-[7px] rounded-[18px] bg-card px-[15px] text-[14px] font-medium text-ink">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1v8M1 5h8" stroke="#EDEDEB" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add
          </span>
        </div>

        <SectionHead title="Where things stand" note="Hold to fix" />
        <div className="anim overflow-hidden rounded-[17px] bg-card" style={an("k-rise", 900, 650)}>
          {stand.map(([text, day], i) => (
            <div key={text}>
              {i > 0 && <div className="mx-[14px] h-[0.5px] bg-line" />}
              <div className="flex items-start gap-[11px] px-[14px] py-[12px]">
                <span className="mt-[7px] flex w-[11px] justify-center">
                  <Tri />
                </span>
                <span className="flex-1 text-[14.5px] leading-[20.5px] tracking-[-0.1px] text-ink">{text}</span>
                <span className="mt-[2px] text-[12px] text-faint tabular">{day}</span>
              </div>
            </div>
          ))}
        </div>

        <SectionHead title="Between you" />
        <div className="anim overflow-hidden rounded-[17px] bg-card" style={an("k-rise", 1300, 650)}>
          {[
            ["You", "send the new deck for Sara", "Friday"],
            ["Sara", "send you the final copy", "Sunday"],
          ].map(([who, what, when], i) => (
            <div key={who}>
              {i > 0 && <div className="mx-[14px] h-[0.5px] bg-line" />}
              <div className="flex items-start gap-[11px] px-[14px] py-[12px]">
                <span className="mt-[2px] h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px] border-muted" />
                <span className="flex-1 text-[14.5px] leading-[20.5px] text-soft">
                  <b className="font-semibold text-ink">{who}</b>: {what}
                </span>
                <span className="mt-[2px] text-[12px] text-faint">{when}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="anim mt-[18px] rounded-[17px] bg-card p-[16px]" style={an("k-rise", 1700, 650)}>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-muted">Krovvi’s read</span>
            <span className="text-[12px] text-faint">Updated today</span>
          </div>
          <div className="mt-[8px] text-[15.5px] leading-[23px] tracking-[-0.15px] text-ink">
            You work with Sara more than anyone. She&apos;s waiting on your deck before the launch, and she leaves for Dubai in
            November.
          </div>
        </div>
      </div>
    </div>
  );
}

const CLOSEST: Array<{ name: string; line: string; day: string }> = [
  { name: "Sara Ali", line: "Waiting on your new deck", day: "Tue" },
  { name: "Mom", line: "Dinner on Sunday at 7", day: "Sat" },
  { name: "Karim Nabil", line: "You owe him the signed quote", day: "Mon" },
  { name: "Lina", line: "Asked to swap the 25th", day: "Mon" },
];

export function PeopleVisual() {
  return (
    <div className="flex flex-col gap-5">
      {/* Your closest people, and what is open with each; Sara is opened below. */}
      <div className="rounded-[22px] bg-ground px-4 py-3">
        <div className="flex items-baseline justify-between px-1 py-1">
          <span className="text-[13px] font-semibold text-muted">Closest now</span>
          <span className="text-[12px] text-faint">Last talked</span>
        </div>
        {CLOSEST.map((p, i) => (
          <div key={p.name} className="anim" style={an("k-rise", 200 + i * 130, 650)}>
            {i > 0 && <div className="ml-[48px] h-px bg-line/70" />}
            <div
              className={`flex items-center gap-3 rounded-[12px] px-1 py-[10px] ${i === 0 ? "seq" : ""}`}
              style={i === 0 ? seq("k-row-press 420ms var(--ease) 1150ms both") : undefined}
            >
              <PersonFace name={p.name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold tracking-[-0.15px] text-ink">{p.name}</div>
                <div className="truncate text-[13px] text-muted">{p.line}</div>
              </div>
              <span className="shrink-0 text-[12px] text-faint">{p.day}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="anim mx-auto w-[min(290px,100%)]" style={an("k-rise-lg", 1450, 900)}>
        <Phone shadow={false} label="Sara's page in Krovvi: where things stand, what you owe each other, and Krovvi's read on her.">
          <PersonScreen />
        </Phone>
      </div>
    </div>
  );
}

/* ── C. It understands what you're working toward: Krovvi's read on you ── */

const ROOMS: Array<{ kind: string; line: string; meta: string }> = [
  { kind: "A goal", line: "Launch Atlas on October 15", meta: "2 things moving it" },
  { kind: "Still deciding", line: "Whether to take the job in Dubai", meta: "since September" },
  { kind: "A rule Krovvi follows", line: "Keep replies to Karim short", meta: "Used 4 times" },
];

export function ReadOnYouVisual() {
  const read = "You're deep in the Atlas launch, and weekends are for the kids. You like short answers, with the answer first.".split(" ");
  return (
    <div className="rounded-[22px] bg-ground p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-muted">Krovvi’s read on you</span>
        <span className="text-[12px] text-faint">Rewritten Tuesday</span>
      </div>
      <div className="mt-3 text-[15.5px] leading-[23px] tracking-[-0.15px] text-ink">
        {read.map((w, i) => (
          <span key={i} className="anim" style={an("k-fade", 300 + i * 45, 260)}>
            {w}{" "}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-[8px]">
        {ROOMS.map((room, i) => (
          <div key={room.kind} className="anim rounded-[14px] bg-card px-[14px] py-[10px]" style={an("k-rise", 1300 + i * 220, 650)}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-semibold tracking-[0.4px] text-faint">{room.kind}</span>
              <span className="text-[11.5px] text-faint">{room.meta}</span>
            </div>
            <div className="mt-[3px] text-[14.5px] leading-[1.35] text-ink">{room.line}</div>
          </div>
        ))}
      </div>
      <div className="anim mt-3 px-[2px] text-[13px] font-medium text-soft" style={an("k-fade", 2200, 600)}>
        Not right?
      </div>
    </div>
  );
}

/* ── D. It keeps up when plans change: the update, and who has the old version ── */

export function ChangedVisual() {
  const tellAt = 2600;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[22px] bg-ground p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-faint">Updated · Today</span>
          <span className="text-[12.5px] font-medium text-soft">Undo</span>
        </div>
        <div className="mt-[6px] text-[16px] font-medium leading-[1.4] tracking-[-0.2px] text-ink">
          The Atlas launch is <span className="anim" style={an("k-pop", 1100, 500)}>October 15</span>
        </div>
        <div className="mt-[4px] text-[13px] leading-[18px] text-soft">
          Was:{" "}
          <span className="relative">
            October 3
            <span className="anim absolute left-0 right-0 top-1/2 h-[1.5px] origin-left bg-soft" style={an("k-strike", 600, 600)} />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-[6px] text-[12.5px] text-faint">
          <Tri /> Heard in Atlas sync, Tuesday
        </div>
      </div>

      <div className="anim rounded-[22px] bg-ground p-5" style={an("k-rise", 1500, 700)}>
        <div className="flex items-center gap-[10px]">
          <PersonFace name="Mona" size={22} />
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-ink">Mona has the old version</span>
        </div>
        <div className="mt-[10px] text-[14.5px] leading-[1.45] text-soft">
          You told Mona the launch was October 3 (14 Sep). It is now October 15.
        </div>
        <div className="mt-[8px] flex gap-[14px] text-[12.5px] text-muted">
          <span className="flex items-center gap-[5px]">
            <Tri /> Said 14 Sep
          </span>
          <span>Now: Sara, Tuesday</span>
        </div>
        <div className="relative mt-[12px] h-[42px]">
          <div className="seq transient absolute inset-0 flex gap-[8px]" style={seq(`k-gone 220ms var(--ease) ${tellAt + 380}ms forwards`)}>
            <span
              className="seq flex flex-1 items-center justify-center rounded-[14px] bg-ink text-[14.5px] font-semibold text-ground"
              style={seq(`k-press 380ms var(--ease) ${tellAt}ms both`)}
            >
              Tell Mona
            </span>
            <span className="flex flex-1 items-center justify-center rounded-[14px] bg-card-hi text-[14.5px] font-medium text-ink">
              Not needed
            </span>
          </div>
          <div className="anim absolute inset-0 flex items-center gap-[8px] text-[14.5px] font-medium text-ink" style={an("k-pop", tellAt + 560, 450)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7.5" fill="#EDEDEB" />
              <path d="M4.8 8.2 7 10.4l4.2-4.6" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sent to Mona.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── E. It speaks up at the right moment: the lock screen before you meet ── */

function LockNote({ title, body, when }: { title: string; body: string; when: string }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[20px] bg-[rgba(46,44,42,0.72)] px-[12px] py-[11px] backdrop-blur-xl">
      <span className="mt-[1px]">
        <AppIcon size={34} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold tracking-[-0.15px] text-white">{title}</span>
          <span className="shrink-0 text-[12px] text-white/50">{when}</span>
        </div>
        <div className="text-[14px] leading-[1.32] tracking-[-0.1px] text-white/85">{body}</div>
      </div>
    </div>
  );
}

export function SpeakUpVisual() {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-4 pb-5 pt-6"
      style={{ background: "radial-gradient(120% 85% at 30% 0%, #2b2521 0%, #151312 55%, #0b0b0a 100%)" }}
    >
      <div className="text-center">
        <div className="text-[13px] font-semibold text-white/75">Thursday, October 1</div>
        <div className="mt-[2px] text-[64px] font-semibold leading-none tracking-[-2.5px] text-white/95 tabular">6:07</div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="anim" style={an("k-drop", 600, 800)}>
          <LockNote title="Seeing Sara at 6:17" body="You still owe her the new deck. She leaves for Dubai in November." when="now" />
        </div>
        <div className="anim opacity-75" style={an("k-drop", 1700, 800)}>
          <LockNote title="Send Karim the quote" body="You told him Monday. That's today." when="9:00" />
        </div>
      </div>
    </div>
  );
}

/* ── F. It knows who owes what: one of the app's own questions, answered from your conversations ── */

type Owe = { name: string; line: string; what: string; amount: string; mine?: boolean; src: { title: string; at?: string; chat?: boolean } };

const OWES: Owe[] = [
  { name: "Omar", line: "Omar owes you", what: "for dinner on Saturday", amount: "200", src: { title: "Dinner with Omar", at: "41:05" } },
  { name: "Lina", line: "Lina owes you", what: "her half of summer camp", amount: "300", src: { title: "Chat with Lina", chat: true } },
  { name: "Karim Nabil", line: "You owe Karim", what: "when the kitchen is done", amount: "21,000", mine: true, src: { title: "Kitchen walkthrough", at: "12:08" } },
];

/** Where a line came from, as the chat's receipt pill: play and the second, or the chat it was read in. */
function Source({ title, at, chat }: { title: string; at?: string; chat?: boolean }) {
  return (
    <span className="inline-flex h-[22px] items-center gap-[6px] whitespace-nowrap rounded-full bg-card-hi pl-[7px] pr-[9px] text-[12px] font-medium text-soft">
      {chat ? (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3.5c-4.9 0-8.5 3.2-8.5 7.2 0 2.1 1 4 2.7 5.3l-.7 3.8 3.9-2c.8.2 1.7.3 2.6.3 4.9 0 8.5-3.2 8.5-7.3S16.9 3.5 12 3.5Z"
            fill="none"
            stroke="#8F8F8A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Tri color="#A9A8A2" />
      )}
      {title}
      {at && <span className="text-[11px] font-normal text-faint tabular">{at}</span>}
    </span>
  );
}

export function OwesVisual() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div
          className="anim max-w-[420px] rounded-[20px] rounded-br-[7px] bg-card-hi px-[16px] py-[11px] text-[16px] leading-[1.35] tracking-[-0.15px] text-ink"
          style={an("k-pop", 300, 420)}
        >
          My money with people. Who owes what?
        </div>
      </div>
      <div className="overflow-hidden rounded-[22px] bg-ground">
        {OWES.map((o, i) => (
          <div key={o.name} className="anim" style={an("k-rise", 1000 + i * 240, 650)}>
            {i > 0 && <div className="mx-5 h-px bg-line" />}
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-[16px]">
              <PersonFace name={o.name} size={40} />
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-[-0.2px] text-ink">{o.line}</div>
                <div className="mt-[5px] flex flex-wrap items-center gap-x-[10px] gap-y-[6px] text-[14px] text-muted">
                  <span>{o.what}</span>
                  <Source {...o.src} />
                </div>
              </div>
              <div className={`text-[clamp(24px,2.7vw,34px)] font-semibold tracking-[-0.03em] tabular ${o.mine ? "text-soft" : "text-ink"}`}>
                {o.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="anim flex flex-wrap items-baseline justify-between gap-2 px-2 text-[14px]" style={an("k-fade", 1900, 600)}>
        <span className="text-muted">
          Owed to you <span className="ml-1 font-semibold text-ink tabular">500</span>
        </span>
        <span className="text-muted">
          You owe <span className="ml-1 font-semibold text-soft tabular">21,000</span>
        </span>
      </div>
    </div>
  );
}
