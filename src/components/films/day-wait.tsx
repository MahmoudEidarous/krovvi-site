"use client";

import { DeepChat, KrovviText, MyBubble, Turn, Working } from "@/components/deep";
import { PhoneSky } from "@/components/sky/phone-sky";

import { type Beat, Thread, useBeats } from "./chat-film";
import type { FilmProps } from "./day";

/* Stand-ins for the two films whose pieces the helpers are drawing (the game card and the chart). Replaced on merge. */

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

export const HelpFilm = (p: FilmProps) => <Film {...p} beats={HELP} time="8:05" seed={23} />;
export const HELP_LABEL = "Next morning. You ask: If I put away 400 a month, when can I buy the car? Krovvi: With $6,500 saved and $400 a month, you'd have the $20,000 by August 2029, with a chart you can slide.";
