"use client";

import { useRef } from "react";

import { ActionsRow, DeepChat, KrovviText, MyBubble, Turn, Working } from "@/components/deep";
import { Thread, useBeats, type Beat } from "@/components/films/chat-film";
import { useFirstSeen } from "@/components/films/use-seen";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { PhoneSky } from "@/components/sky/phone-sky";
import { an } from "@/lib/anim";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * What using it more gets you, shown rather than told: the same big
 * question asked on day one and six months in. One answer could be for
 * anyone; the other weighs the person's own life, the way a friend who was
 * there would: their sister, what they told a friend they wanted, their
 * money, and what they would miss.
 */

const ASK = "Should I take the job in Lisbon?";

const DAY_ONE_ANSWER = `It depends on what matters most to you. A few things to weigh:

- The salary against the cost of living
- What it does for your career
- Being far from family and friends
- How easy it would be to come back

What's making you think about it?`;

const MONTH_SIX_ANSWER = `Here's what it would touch in your life:

- **Lina.** You'd be near her again. She said the spare room is yours.
- **Work.** It's the lead role you told Omar you wanted.
- **Money.** Rent is lower there, so the car comes about a year sooner.
- **Friends.** You'd miss Friday dinners with Omar and Mona.

Want a list of what to settle first?`;

function beatsFor(answer: string, start: number): Beat[] {
  return [
    { id: "q", wait: start, gap: 0, show: () => <MyBubble text={ASK} rise /> },
    { id: "w", wait: 450, gap: 16, until: "a", show: () => <Working /> },
    {
      id: "a",
      wait: 1500,
      gap: 0,
      show: () => (
        <Turn>
          <KrovviText text={answer} bloom style={{ marginBottom: -16 }} />
        </Turn>
      ),
    },
    {
      id: "v",
      wait: 500,
      gap: 0,
      show: () => (
        <Turn>
          <ActionsRow fade />
        </Turn>
      ),
    },
  ];
}

const DAY_ONE = beatsFor(DAY_ONE_ANSWER, 300);
const MONTH_SIX = beatsFor(MONTH_SIX_ANSWER, 900);

/** Empty until it is reached, then played once; finished from the start when motion is reduced. */
function Played({ beats, playing, still, seed }: { beats: Beat[]; playing: boolean; still: boolean; seed: number }) {
  const { n } = useBeats(beats, { playing: playing && !still, loop: false });
  return (
    <div className="absolute inset-0">
      <DeepChat sky={<PhoneSky seed={seed} />} veil columnStyle={{ gap: 0, paddingTop: 6 }}>
        <Thread beats={beats} at={still ? beats.length : n} />
      </DeepChat>
    </div>
  );
}

export function Loop() {
  const reduced = useReducedMotion();
  // Each phone plays when it is in view: on a phone Month 6 stands under Day 1, a scroll later.
  const one = useRef<HTMLElement>(null);
  const six = useRef<HTMLElement>(null);
  const oneSeen = useFirstSeen(one, "0px 0px -30% 0px");
  const sixSeen = useFirstSeen(six, "0px 0px -30% 0px");

  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[860px] text-center">
          <h2
            className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            The more you use it, the more it knows you.
          </h2>
          <p
            className="anim mx-auto mt-6 max-w-[560px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted"
            style={an("k-rise", 150, 900)}
          >
            On day one, it answers like any AI. A few months in, it answers like a friend who was there.
          </p>
        </div>

        <div className="relative mt-16 grid items-start justify-items-center gap-20 md:mt-20 md:grid-cols-2 md:gap-10 lg:gap-20">
          <figure ref={one} className="anim w-[min(290px,74vw)] md:mt-10" style={an("k-rise", 300, 900)}>
            <figcaption className="mb-7 text-center">
              <div className="text-[clamp(22px,2.2vw,28px)] font-semibold tracking-[-0.03em] text-faint">Day 1</div>
              <div className="mt-1 text-[15px] text-faint">It doesn&apos;t know your life yet.</div>
            </figcaption>
            <div className="opacity-[0.78] saturate-[0.6]">
              <Phone label={`Day one. You ask: "${ASK}" Krovvi lists the usual things to weigh and asks what's making you think about it.`}>
                <Played beats={DAY_ONE} playing={oneSeen} still={reduced} seed={23} />
              </Phone>
            </div>
          </figure>

          <figure ref={six} className="anim relative w-[min(330px,80vw)]" style={an("k-rise", 450, 900)}>
            <div className="glow-warm left-1/2 top-[55%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2" />
            <figcaption className="relative mb-7 text-center">
              <div className="text-[clamp(22px,2.2vw,28px)] font-semibold tracking-[-0.03em] text-ink">Month 6</div>
              <div className="mt-1 text-[15px] text-muted">It knows what&apos;s at stake.</div>
            </figcaption>
            <div className="relative">
              <Phone label={`Six months in. Same question. Krovvi weighs what the move would touch: you'd be near your sister Lina again, and she said the spare room is yours; it's the lead role you told Omar you wanted; rent is lower, so the car comes about a year sooner; and you'd miss Friday dinners with Omar and Mona. Then it offers a list of what to settle first.`}>
                <Played beats={MONTH_SIX} playing={sixSeen} still={reduced} seed={31} />
              </Phone>
            </div>
          </figure>
        </div>
      </InView>
    </section>
  );
}
