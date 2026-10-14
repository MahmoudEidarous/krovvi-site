"use client";

import { DeepChat, KrovviBubbles, KrovviText, MyBubble, Turn, Working, emo } from "@/components/deep";
import { PhoneSky } from "@/components/sky/phone-sky";

import { type Beat, Thread, useBeats } from "./chat-film";
import type { FilmProps } from "./day";

/* Stand-ins for the two films whose pieces the helpers are drawing (the game card and the chart). Replaced on merge. */

const PLAY: Beat[] = [
  { id: "q", wait: 450, gap: 0, show: () => <MyBubble text="I'm bored. Play something with me" rise /> },
  { id: "w", wait: 450, gap: 16, until: "a", show: () => <Working /> },
  { id: "a", wait: 1200, gap: 0, show: () => <Turn><KrovviBubbles lines={["Two truths and a lie, about you 👀", "One of these I made up."].map((l) => emo(l))} rise stagger={420} /></Turn> },
];

const HELP: Beat[] = [
  { id: "q", wait: 450, gap: 0, show: () => <MyBubble text="If I put away 400 a month, when can I buy the car?" rise /> },
  { id: "w", wait: 450, gap: 16, until: "a", show: () => <Working /> },
  {
    id: "a",
    wait: 1500,
    gap: 0,
    show: () => (
      <Turn>
        <KrovviText text="With $6,500 saved and $400 a month, you'd have the $20,000 by **August 2029**. Slide to see how much a bigger amount brings it in." bloom />
      </Turn>
    ),
  },
];

function Film({ beats, playing, still = false, time, seed }: FilmProps & { beats: Beat[]; time: string; seed: number }) {
  const { n } = useBeats(beats, { playing: playing && !still, loop: false });
  return (
    <div className="absolute inset-0">
      <DeepChat sky={<PhoneSky seed={seed} />} veil time={time} columnStyle={{ gap: 0, paddingTop: 6 }}>
        <Thread beats={beats} at={still ? beats.length : n} />
      </DeepChat>
    </div>
  );
}

export const PlayFilm = (p: FilmProps) => <Film {...p} beats={PLAY} time="11:40" seed={7} />;
export const HelpFilm = (p: FilmProps) => <Film {...p} beats={HELP} time="8:05" seed={23} />;
export const PLAY_LABEL = "11:40 PM. You say you're bored. Krovvi starts Two truths and a lie, about you: three things about your life, one of them made up.";
export const HELP_LABEL = "Next morning. You ask: If I put away 400 a month, when can I buy the car? Krovvi: With $6,500 saved and $400 a month, you'd have the $20,000 by August 2029, with a chart you can slide.";
