"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";

import { ChatTellScreen, ShareScreen, UploadScreen } from "@/components/app/input-screens";
import { BriefScreen, CaughtScreen } from "@/components/app/note-screens";
import { RecordScreen } from "@/components/app/record-screen";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Every way in, then what comes of it. One big word and one short line per
 * step; the phone shows the step happening in the app.
 */
type Step = { word: string; line: string; label: string; screen: () => React.ReactNode };

const STEPS: Step[] = [
  {
    word: "Talk.",
    line: "Record a conversation in person, or send Krovvi to your Zoom, Meet or Teams call.",
    label: "Recording in Krovvi: the timer runs and the voice moves.",
    screen: () => <RecordScreen />,
  },
  {
    word: "Chat.",
    line: "Ask it anything, or tell it something to keep. Type it or say it.",
    label: "A chat with Krovvi: you tell it Lina has the kids on Wednesday, and it keeps that with Lina.",
    screen: () => <ChatTellScreen />,
  },
  {
    word: "Upload.",
    line: "Photos, screenshots, PDFs and voice notes. It reads every one.",
    label: "A lease added to Krovvi as a PDF, and what it found inside: the new rent and the notice period.",
    screen: () => <UploadScreen />,
  },
  {
    word: "Share.",
    line: "Send a WhatsApp chat, a link or a video from whatever app you're in.",
    label: "A WhatsApp chat shared to Krovvi from the share sheet, read and understood.",
    screen: () => <ShareScreen />,
  },
  {
    word: "It understands.",
    line: "It works out what was promised, decided and paid, and who it's about.",
    label: "What I caught: a task, a decision, a sum and a date, each with the second it was said.",
    screen: () => <CaughtScreen />,
  },
  {
    word: "It remembers.",
    line: "Before you see someone, it tells you where things stand.",
    label: "Sara Ali, in 25 minutes: last time, what you owe, what Sara owes you, and what is worth knowing.",
    screen: () => <BriefScreen />,
  },
];

export function Story() {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // The story follows the scroll: where the middle of the screen sits along
  // the steps decides the step, and a bar under the phone fills as you go.
  const { scrollYProgress } = useScroll({ target: track, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setActive((now) => (now === next ? now : next));
  });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Nothing plays before the story is on screen: the first film starts when you reach it.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -35% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The phone settles in as the section arrives.
  const { scrollYProgress: arrive } = useScroll({ target: track, offset: ["start end", "start 35%"] });
  const settle = useTransform(arrive, [0, 1], [0.94, 1]);
  const light = useTransform(arrive, [0, 1], [0.4, 1]);

  return (
    <section id="how" className="relative scroll-mt-10 px-5 pt-[120px] md:pt-[180px]">
      <div className="mx-auto max-w-[1160px]">
        <InView className="max-w-[760px]">
          <div className="anim text-[14px] font-medium text-muted" style={an("k-fade", 0, 800)}>How it works</div>
          <h2
            className="anim mt-3 text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 100, 1000)}
          >
            Tell it things. Send it things.
          </h2>
          <p className="anim mt-6 max-w-[520px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 250, 900)}>
            However it reaches Krovvi, it lands in one place, linked to the people and plans it&apos;s about.
          </p>
        </InView>

        {/* Wide screens: the phone stays, the words move past it. */}
        <div className="relative mt-4 hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-14 lg:gap-24">
          <div ref={track}>
            {STEPS.map((step, i) => (
              <div key={i} className="flex min-h-[72vh] flex-col justify-center">
                <div
                  className="transition-[opacity,transform,filter] duration-700"
                  style={{
                    opacity: active === i ? 1 : 0.14,
                    transform: active === i ? "none" : "translateY(12px)",
                    filter: active === i ? "none" : "blur(1.5px)",
                    transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <h3 className="text-[clamp(56px,7.4vw,104px)] font-semibold leading-[0.98] tracking-[-0.055em]">
                    {step.word}
                  </h3>
                  <p className="mt-6 max-w-[440px] text-pretty text-[clamp(18px,1.7vw,21px)] leading-[1.55] text-muted">{step.line}</p>
                </div>
              </div>
            ))}
          </div>
          <InView hold={false} className="relative">
            <div className="sticky top-[calc(50vh-min(380px,43vh))] flex items-center justify-center py-2">
              <div className="glow-warm left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
              <motion.div className="relative w-[min(340px,37vh)]" style={reduced ? undefined : { scale: settle, opacity: light }}>
                <Phone label={STEPS[active].label}>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={seen ? active : "waiting"}
                      className="absolute inset-0"
                      initial={reduced ? false : { opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={reduced ? undefined : { opacity: 0, scale: 1.01, filter: "blur(4px)" }}
                      transition={{ duration: 0.55, ease: EASE }}
                    >
                      {seen ? STEPS[active].screen() : <div className="h-full w-full bg-ground" />}
                    </motion.div>
                  </AnimatePresence>
                </Phone>
                {/* Where we are in the story: the step's name and a bar that fills as you scroll. */}
                <div className="mx-auto mt-7 flex w-[min(280px,100%)] items-center gap-3" aria-hidden="true">
                  <span className="whitespace-nowrap text-right text-[13px] font-medium text-soft">{STEPS[active].word.replace(/\.$/, "")}</span>
                  <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                    <motion.span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: fill }} />
                  </span>
                  <span className="w-[34px] text-[13px] text-faint tabular">
                    {active + 1}/{STEPS.length}
                  </span>
                </div>
              </motion.div>
            </div>
          </InView>
        </div>

        {/* Phones: each step with its own screen. */}
        <div className="mt-16 flex flex-col gap-24 md:hidden">
          {STEPS.map((step, i) => (
            <div key={i}>
              <h3 className="text-[52px] font-semibold leading-[1] tracking-[-0.05em]">{step.word}</h3>
              <p className="mt-4 text-pretty text-[17px] leading-[1.6] text-muted">{step.line}</p>
              <InView className="relative mx-auto mt-10 w-[min(300px,78vw)]">
                <Phone label={step.label}>{step.screen()}</Phone>
              </InView>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
