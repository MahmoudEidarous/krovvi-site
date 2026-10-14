"use client";

import { useRef } from "react";

import { KrovviBubbles, MoveHeader, MyBubble, Turn, emo } from "@/components/deep";
import { Phone } from "@/components/phone";
import { PhoneSky } from "@/components/sky/phone-sky";
import { DeepChat } from "@/components/deep";

import { type Beat, Thread } from "./chat-film";
import { PanelThread, SkyPanel, usePlayOnce } from "./tiles";

/* Stand-ins for the tiles whose pieces the helpers are drawing (question cards, lock screen, sent things, widgets). Replaced on merge. */

const ASKS: Beat[] = [{ id: "a", wait: 400, gap: 0, show: () => <Turn><KrovviBubbles lines={[emo("Got a few quick ones for you 🙂")]} rise /></Turn> }];

export function PeopleVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(ASKS, ref);
  return (
    <div ref={ref} className="mx-auto w-[min(330px,100%)]">
      <Phone label="Krovvi asks a few quick questions about the people in your life.">
        <div className="absolute inset-0">
          <DeepChat sky={<PhoneSky seed={83} />} veil columnStyle={{ gap: 0, paddingTop: 6 }}>
            <Thread beats={ASKS} at={at} />
          </DeepChat>
        </div>
      </Phone>
    </div>
  );
}

const FIRST: Beat[] = [
  { id: "m", wait: 400, gap: 0, show: () => <Turn><MoveHeader text="Your aunt's birthday" kind="event" /><KrovviBubbles lines={[emo("Your aunt's birthday is tomorrow\u00a0🎂"), "Want a nudge in the morning to text her?"]} rise stagger={420} /></Turn> },
];

export function TextsFirstVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(FIRST, ref);
  return (
    <div ref={ref}>
      <SkyPanel h={220} seed={89}>
        <PanelThread beats={FIRST} at={at} />
      </SkyPanel>
    </div>
  );
}

const SENT: Beat[] = [
  { id: "q", wait: 400, gap: 0, show: () => <MyBubble text="Receipt from Lume" rise /> },
  { id: "a", wait: 1000, gap: 16, show: () => <Turn><KrovviBubbles lines={["Lume, $92 for two. It's in Money to confirm."]} rise /></Turn> },
];

export function SendVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const at = usePlayOnce(SENT, ref);
  return (
    <div ref={ref}>
      <SkyPanel h={220} seed={97}>
        <PanelThread beats={SENT} at={at} />
      </SkyPanel>
    </div>
  );
}

export function CloseVisual() {
  return (
    <SkyPanel h={220} seed={101}>
      <div />
    </SkyPanel>
  );
}
