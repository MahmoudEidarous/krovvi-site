import type { ReactNode } from "react";

import { DeepChat, HomeScreen, KrovviWidget, LockScreen, MessageWidget, Notification, RecordWidget, SavingsCard, SavingsQuestion, SavingsTurn } from "@/components/deep";
import { SavingsLive } from "@/components/deep/answers-live";
import { PhoneSky } from "@/components/sky/phone-sky";

export interface Scene {
  id: string;
  title: string;
  draw: () => ReactNode;
}

const sky = <PhoneSky />;

/** The demo world's messages from Krovvi (the brief): today's interview at Northline, and Sam's contract. */
const NOTES = [
  { text: "How did the Northline interview go? 🙂", when: "now" },
  { text: "Sam said the contract would come by Monday. It's not here yet. Want me to nudge him?", when: "2m ago" },
];

/** The captures' own sample words, for the match scenes only. */
const CAPTURE = {
  long: "Saturday at 8 is confirmed 👌 Want me to remind you about the building on Tuesday?",
  call: "How did the call with Karim go? 👀",
};

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
  {
    id: "lock",
    title: "The lock screen at night, two messages from Krovvi",
    draw: () => <LockScreen notes={NOTES} />,
  },
  {
    id: "lock-widgets",
    title: "The lock screen with Krovvi's widgets and one message",
    draw: () => <LockScreen inline="Krovvi: How did the Northline interview go?" widgets={{ text: NOTES[0].text, when: "now" }} notes={[NOTES[1]]} />,
  },
  {
    id: "banner",
    title: "A message from Krovvi dropping in over an app",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <Notification banner text={NOTES[0].text} style={{ position: "absolute", left: 8, top: 56 }} />
      </div>
    ),
  },
  {
    id: "widgets",
    title: "Krovvi and Message Krovvi, small and medium",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#16223a", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 70 }}>
        <KrovviWidget size="medium" text={NOTES[0].text} when="now" />
        <div style={{ display: "flex", gap: 22 }}>
          <KrovviWidget size="small" text={NOTES[1].text} when="2m" unread={false} />
          <MessageWidget size="small" />
        </div>
        <MessageWidget size="medium" />
        <div style={{ display: "flex", gap: 22 }}>
          <RecordWidget />
          <KrovviWidget size="small" />
        </div>
      </div>
    ),
  },
  {
    id: "home",
    title: "The home screen with Krovvi on it",
    draw: () => <HomeScreen />,
  },
  {
    id: "home-widgets",
    title: "The widgets laid out as home-en.png",
    draw: () => <HomeScreen layout="widgets" />,
  },
  {
    id: "match-krovvi-medium",
    title: "Match: krovvi-medium-en.png (364 x 170)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <KrovviWidget size="medium" text={CAPTURE.long} when="2m" width={364} height={170} />
      </div>
    ),
  },
  {
    id: "match-krovvi-small",
    title: "Match: krovvi-small-en.png (170 x 170)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <KrovviWidget size="small" text={CAPTURE.call} when="now" width={170} height={170} />
      </div>
    ),
  },
  {
    id: "match-message-medium",
    title: "Match: message-medium-en.png (364 x 170)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <MessageWidget size="medium" width={364} height={170} />
      </div>
    ),
  },
  {
    id: "match-message-small",
    title: "Match: message-small-en.png (170 x 170)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <MessageWidget size="small" width={170} height={170} />
      </div>
    ),
  },
  {
    id: "match-banner",
    title: "Match: notify-on-iphone-en.png (a 390 point screen)",
    draw: () => (
      <div style={{ position: "absolute", inset: 0, background: "#030303" }}>
        <Notification banner text={CAPTURE.long} width={374} style={{ position: "absolute", left: 8, top: 40 }} />
      </div>
    ),
  },
  {
    id: "match-lock",
    title: "Match: lock-en.png (drawn for a 402 point phone)",
    draw: () => <LockScreen inline={`Krovvi: ${CAPTURE.call}`} widgets={{ text: CAPTURE.call, when: "now" }} buttons={false} />,
  },
];
