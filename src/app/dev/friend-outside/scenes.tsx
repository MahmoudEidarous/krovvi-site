import type { ReactNode } from "react";

import { DeepChat, SavingsCard, SavingsQuestion, SavingsTurn } from "@/components/deep";
import { SavingsLive } from "@/components/deep/answers-live";
import { PhoneSky } from "@/components/sky/phone-sky";

export interface Scene {
  id: string;
  title: string;
  draw: () => ReactNode;
}

const sky = <PhoneSky />;

export const SCENES: Scene[] = [
  {
    id: "car",
    title: "An answer as a screen: saving for the car (framed as car.png)",
    draw: () => (
      <DeepChat sky={sky} veil top={null} composer={null}>
        <SavingsQuestion />
        <SavingsTurn card={<SavingsLive value={400} />} />
      </DeepChat>
    ),
  },
  {
    id: "car-chat",
    title: "The same answer in the chat, at its end",
    draw: () => (
      <DeepChat sky={sky} veil>
        <SavingsQuestion />
        <SavingsTurn card={<SavingsLive value={400} />} />
      </DeepChat>
    ),
  },
  {
    id: "car-600",
    title: "The same screen at $600 a month",
    draw: () => (
      <DeepChat sky={sky} veil>
        <SavingsQuestion />
        <SavingsTurn perMonth={600} card={<SavingsCard perMonth={600} />} />
      </DeepChat>
    ),
  },
  {
    id: "car-auto",
    title: "Driven: the slider moves itself to $900",
    draw: () => (
      <DeepChat sky={sky} veil>
        <SavingsQuestion />
        <SavingsTurn card={<SavingsLive value={400} auto={900} autoDelay={900} />} />
      </DeepChat>
    ),
  },
  {
    id: "match-car-card",
    title: "Match: car.png's card (332 wide, as on 10 October)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <SavingsCard width={332} style={{ position: "absolute", left: 38, top: 310.4, margin: 0 }} />
      </div>
    ),
  },
];
