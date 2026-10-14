"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AskCard, AskFold, AskStack, DeepChat, KrovviBubbles, MyBubble, ThisOrThat, Turn, type Pair } from "@/components/deep";
import { PhoneSky } from "@/components/sky/phone-sky";

/**
 * Two moments played on a loop, for the review page only: how the props
 * step a swipe and an answer through, at the app's own timings (a pick shows
 * 620 ms before its card lifts off, this-or-that.tsx:105; a tapped answer is
 * lit 160 ms before its card goes, krovvi-asks.tsx:784).
 */

/** Steps through `times` (ms from the start, the first 0), and round again after `loop`. */
function useStep(times: number[], loop: number): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      timers = times.map((t, i) => setTimeout(() => setStep(i), t));
      timers.push(setTimeout(run, loop));
    };
    run();
    return () => timers.forEach(clearTimeout);
    // The schedule is fixed for the life of the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return step;
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <DeepChat
      sky={
        <>
          <div style={{ position: "absolute", inset: 0, background: "#010101" }} />
          <PhoneSky />
        </>
      }
      veil
    >
      {children}
    </DeepChat>
  );
}

const COFFEE: Pair = { a: { emoji: "☕", label: "Coffee" }, b: { emoji: "🍵", label: "Tea" }, guess: "a" };
const OWL: Pair = { a: { emoji: "🦉", label: "Night owl" }, b: { emoji: "🐦", label: "Early bird" }, guess: "a" };

/** A swipe toward Tea: the pull eased in, the pick and Krovvi's guess, the card lifting off and the next growing in. */
export function SwipeLoop() {
  const step = useStep([0, 700, 1150, 1770, 3600], 4400);
  const line = "I already guessed each of yours 😏";
  return (
    <Screen>
      <MyBubble text="I'm bored" />
      <Turn>
        <KrovviBubbles lines={["Let's fix that 😄", "Quick round of This or That. Tap one, or swipe toward it."]} />
        {step === 0 ? <ThisOrThat pair={COFFEE} at={1} line={line} glide={420} /> : null}
        {step === 1 ? <ThisOrThat pair={COFFEE} at={1} line={line} pull={84} glide={420} /> : null}
        {step === 2 ? <ThisOrThat pair={COFFEE} at={1} line={line} pull={56} glide={240} chosen="b" pop /> : null}
        {step >= 3 ? <ThisOrThat pair={OWL} at={2} line={line} arrive leaving={{ pair: COFFEE, chosen: "b", from: 56 }} /> : null}
      </Turn>
    </Screen>
  );
}

const SAM = {
  what: "Someone",
  where: "Chat",
  question: "Who is Sam to you?",
  because: "You mentioned him three times this week.",
  quote: "Sam said he would send the contract by Monday.",
  options: ["From work", "A friend", "Family"],
};
const LINA = {
  what: "Date",
  where: "Chat",
  question: "Is dinner with Lina on Friday or Saturday?",
  because: "You said both, and I want to remind you on the right day.",
  quote: "Dinner with Lina on the weekend, Friday I think.",
  options: ["Friday", "Saturday"],
};
const COFFEE_Q = { what: "You", where: "Chat", question: "Coffee or tea in the morning?", options: ["Coffee", "Tea"] };

/**
 * Three questions answered in a row, each lit a beat, lifted off and the next
 * growing in, then the fold. One stack whose props change, so the plates
 * waiting slide up a place as the app's do.
 */
export function AnswerLoop() {
  const step = useStep([0, 1400, 1560, 3000, 3160, 4600, 4760], 6400);
  const card1 = <AskCard {...SAM} tip picked={step >= 1 ? 0 : null} />;
  const card2 = <AskCard {...LINA} picked={step >= 3 ? 0 : null} />;
  const card3 = <AskCard {...COFFEE_Q} picked={step >= 5 ? 0 : null} />;
  const at = step <= 1 ? 1 : step <= 3 ? 2 : 3;
  return (
    <Screen>
      <Turn>
        <KrovviBubbles lines={["Got a few quick ones for you 🙂"]} />
        {step < 6 ? (
          <AskStack
            label={`${at} of 3`}
            next={[LINA.question, COFFEE_Q.question].slice(at - 1)}
            arrive={at > 1}
            leaving={step === 2 ? card1 : step === 4 ? card2 : undefined}
          >
            {at === 1 ? card1 : at === 2 ? card2 : card3}
          </AskStack>
        ) : (
          <AskFold text="All 3 answered" check live />
        )}
      </Turn>
    </Screen>
  );
}
