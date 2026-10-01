"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { AgreedScreen, BriefScreen, CaughtScreen, DebriefScreen, LinkScreen } from "@/components/app/note-screens";
import { RecordScreen } from "@/components/app/record-screen";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";

const EASE = [0.23, 1, 0.32, 1] as const;

type Step = { title: string; body: string; label: string; screen: () => React.ReactNode };

const STEPS: Step[] = [
  {
    title: "Record the conversation.",
    body: "Tap once when you talk in person. For a Zoom, Meet or Teams call, send Krovvi to join it. Talk the way you always do, in English, Arabic or both.",
    label: "Recording in Krovvi: the timer runs and the voice moves.",
    screen: () => <RecordScreen />,
  },
  {
    title: "See what was caught.",
    body: "Soon after you stop, Krovvi shows what was promised, decided and paid. Tap any line to hear the moment it was said.",
    label: "What I caught: a task, a decision, a sum and a date, each with the second it was said.",
    screen: () => <CaughtScreen />,
  },
  {
    title: "Send them what you agreed.",
    body: "One tap sends the other person a short list of what you agreed. They confirm it or fix a line, without the app. Nothing goes out unless you tap.",
    label: "What you agreed with Sara, sent, opened and confirmed.",
    screen: () => <AgreedScreen />,
  },
  {
    title: "Know where things stand before you meet again.",
    body: "Before your next meeting, Krovvi shows what you owe them, what they owe you, and anything new worth knowing.",
    label: "Sara Ali, in 25 minutes: last time, what you owe, what Sara owes you, and what is worth knowing.",
    screen: () => <BriefScreen />,
  },
  {
    title: "Say what changed. Krovvi updates.",
    body: "After you meet, tell Krovvi in a few words. It updates the dates and the tasks, and you can undo any change.",
    label: "How did it go with Sara? Krovvi updated 2 things, each with Undo.",
    screen: () => <DebriefScreen />,
  },
];

export function Story() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how" className="relative scroll-mt-10 px-5 pt-10 md:pt-24">
      <div className="mx-auto max-w-[1120px]">
        <InView className="mx-auto max-w-[760px] text-center">
          <div className="anim text-[14px] font-medium text-muted" style={an("k-fade", 0, 800)}>How it works</div>
          <h2 className="anim mt-3 text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]" style={an("k-rise-lg", 100, 1000)}>
            One conversation, start to finish.
          </h2>
        </InView>

        {/* Wide screens: the phone stays, the story moves past it. */}
        <div className="relative mt-10 hidden md:grid md:grid-cols-[1fr_minmax(0,440px)] md:gap-16 lg:gap-24">
          <div>
            {STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-step={i}
                className="flex min-h-[86vh] flex-col justify-center"
              >
                <div
                  className="transition-[opacity,transform] duration-500"
                  style={{
                    opacity: active === i ? 1 : 0.28,
                    transform: active === i ? "none" : "translateY(6px)",
                    transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <div className="text-[15px] font-medium text-faint tabular">0{i + 1}</div>
                  <h3 className="mt-3 max-w-[480px] text-balance text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.08] tracking-[-0.035em]">
                    {step.title}
                  </h3>
                  <p className="mt-5 max-w-[460px] text-pretty text-[19px] leading-[1.6] text-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="sticky top-[calc(50vh-min(370px,42vh))] flex items-center justify-center py-2">
              <div className="glow-warm left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2" />
              <div className="relative w-[min(330px,36vh)]">
                {/* At step 3 the phone steps aside so Sara's side can stand next to it. */}
                <motion.div
                  animate={active === 2 ? { x: "-42%", scale: 0.94 } : { x: "0%", scale: 1 }}
                  transition={{ duration: 0.8, ease: EASE }}
                >
                  <Phone label={STEPS[active].label}>
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={active}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.015 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        {STEPS[active].screen()}
                      </motion.div>
                    </AnimatePresence>
                  </Phone>
                </motion.div>
                <AnimatePresence>
                  {active === 2 && (
                    <motion.div
                      key="their-side"
                      className="absolute left-[52%] top-[9%] w-[84%]"
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
                    >
                      <Phone label="Sara's side: a private page in her browser to confirm or fix a line.">
                        <LinkScreen />
                      </Phone>
                      <div className="mt-3 text-center text-[13px] text-faint">Sara&apos;s phone, no app needed</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Phones: each step with its own screen. */}
        <div className="mt-12 flex flex-col gap-24 md:hidden">
          {STEPS.map((step, i) => (
            <div key={i}>
              <div className="text-[14px] font-medium text-faint tabular">0{i + 1}</div>
              <h3 className="mt-2 text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.035em]">{step.title}</h3>
              <p className="mt-3 text-pretty text-[17px] leading-[1.6] text-muted">{step.body}</p>
              <InView className="relative mx-auto mt-8 w-[min(300px,78vw)]">
                <Phone label={step.label}>{step.screen()}</Phone>
                {i === 2 && (
                  <div className="mx-auto mt-6 w-[86%]">
                    <Phone label="Sara's side: a private page in her browser to confirm or fix a line.">
                      <LinkScreen />
                    </Phone>
                    <div className="mt-3 text-center text-[13px] text-faint">Sara&apos;s phone, no app needed</div>
                  </div>
                )}
              </InView>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
