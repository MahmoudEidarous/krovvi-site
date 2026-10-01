"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { Play } from "@/components/app/ui";
import { an } from "@/lib/anim";
import { JOIN_URL } from "@/lib/site";

/**
 * The proof, set in type: a personal question, and the answer only something
 * that was there all week could give, each line with where it was heard.
 * Three questions take turns: the week, a fact, and the minute before a meeting.
 */
type Line = { said: string; more?: string; source: string };
type Scene = { ask: string; lines: Line[] };

const SCENES: Scene[] = [
  {
    ask: "What's going on with me this week?",
    lines: [
      { said: "Sara needs your new deck by Friday.", more: "The launch moved to the 15th.", source: "Atlas sync, Tuesday" },
      { said: "Karim asked twice for the signed quote.", more: "You told him Monday.", source: "Call with Karim, 3:12" },
      { said: "Dinner at your mom's on Sunday at 7.", more: "You're bringing dessert.", source: "Voice note, Saturday" },
      { said: "Lina has the kids on Wednesday.", more: "You're free after 4.", source: "Call with Lina, Monday" },
    ],
  },
  {
    ask: "What did Karim say about the price?",
    lines: [
      { said: "42,000, not the 46,000 in the quote.", more: "Half up front, half on delivery.", source: "Call with Karim, 12:08" },
      { said: "You said you'd send him the signed quote on Monday.", source: "Call with Karim, 3:12" },
    ],
  },
  {
    ask: "Anything I should know before I see Sara?",
    lines: [
      { said: "You still owe her the new deck.", more: "She asked for the updated numbers.", source: "Atlas sync, Tuesday" },
      { said: "She owes you the final copy by Sunday.", source: "Atlas sync, Tuesday" },
      { said: "She's moving to Dubai in November.", source: "Coffee with Sara, Sunday" },
    ],
  },
];

const TYPE_MS = 34; // per character of the question
const WORD_MS = 55; // per word of the answer

function Answer({ scene, first }: { scene: Scene; first: boolean }) {
  const start = first ? 1700 : 300;
  const typed = start + scene.ask.length * TYPE_MS;
  let t = typed + 450;
  return (
    <div>
      <div className="anim text-[13px] font-medium text-faint" style={an("k-fade", start - 200, 500)}>
        You asked Krovvi
      </div>
      <div className="mt-2 text-[clamp(19px,1.9vw,23px)] leading-[1.35] text-soft">
        {scene.ask.split("").map((c, i) => (
          <span key={i} className="anim" style={an("k-fade", start + i * TYPE_MS, 90)}>
            {c}
          </span>
        ))}
        <span
          className="seq ml-[2px] inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-soft"
          style={{ animation: `k-blink 900ms steps(1) ${start}ms 6 both` }}
        />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {scene.lines.map((line, i) => {
          const words = [...line.said.split(" "), ...(line.more ? line.more.split(" ") : [])];
          const saidCount = line.said.split(" ").length;
          const begin = t;
          t += words.length * WORD_MS + 380;
          return (
            <div key={i}>
              <div className="text-[clamp(21px,2.1vw,28px)] font-medium leading-[1.3] tracking-[-0.02em]">
                {words.map((w, j) => (
                  <span
                    key={j}
                    className={`anim ${j < saidCount ? "text-ink" : "text-muted"}`}
                    style={an("k-rise", begin + j * WORD_MS, 420)}
                  >
                    {w}{" "}
                  </span>
                ))}
                <span
                  className="anim ml-1 inline-flex translate-y-[-3px] items-center gap-[6px] whitespace-nowrap align-middle text-[13px] font-normal tracking-normal text-faint"
                  style={an("k-fade", begin + words.length * WORD_MS + 80, 500)}
                >
                  <Play size={6} /> {line.source}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  // Which turn this is; the question shown is round % 3. Only the very first one waits for the headline.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (reduced) return;
    // Each question stays long enough to read, then the next one takes its place.
    const id = setTimeout(() => setRound((r) => r + 1), round === 0 ? 13500 : 10500);
    return () => clearTimeout(id);
  }, [reduced, round]);
  const scene = reduced ? 0 : round % SCENES.length;

  return (
    <section className="relative overflow-clip px-5 pb-8 pt-[118px] md:pt-[140px]">
      <div className="glow-warm left-[62%] top-[18%] h-[900px] w-[900px] -translate-x-1/2" />
      <div className="relative mx-auto max-w-[1200px]">
        <h1 className="text-[clamp(54px,9.4vw,128px)] font-semibold leading-[0.93] tracking-[-0.06em]">
          {["The AI that", "knows your life."].map((row, r) => (
            <span key={r} className="block overflow-hidden pb-[0.06em]">
              <span className="anim inline-block" style={an("k-rise-lg", 250 + r * 160, 1100)}>
                {row}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-12 grid gap-14 md:mt-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="anim" style={an("k-rise", 800, 900)}>
            <p className="max-w-[440px] text-pretty text-[clamp(18px,1.6vw,21px)] leading-[1.6] text-muted">
              Krovvi remembers what people told you, keeps track of what you promised, and notices what changed. So
              when you need it, it&apos;s already caught up.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={JOIN_URL}
                className="rounded-full bg-ink px-7 py-[14px] text-[16px] font-semibold text-ground no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                Join the beta
              </a>
              <a
                href="#how"
                className="rounded-full px-5 py-[14px] text-[16px] font-medium text-ink no-underline transition-colors hover:bg-card"
              >
                See how it works
              </a>
            </div>
            <div className="mt-4 text-[13.5px] text-faint">For iPhone. In beta now.</div>
          </div>

          <div className="min-h-[440px] lg:min-h-[470px]" aria-live="off">
            <div key={round}>
              <Answer scene={SCENES[scene]} first={round === 0} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
