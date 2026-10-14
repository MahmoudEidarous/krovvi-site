import type { ReactNode } from "react";

import {
  ActionsRow,
  AskCard,
  AskFold,
  AskStack,
  DeepChat,
  EmojiRiddle,
  GameFolded,
  GamesSheet,
  GameQuiet,
  GameShelf,
  GuessQuestion,
  GuessStep,
  GuessWon,
  KrovviBubbles,
  KrovviText,
  MyBubble,
  PlusSheetWithPlay,
  ThisOrThat,
  Trivia,
  Turn,
  TwoTruths,
  type Pair,
  type Truth,
} from "@/components/deep";
import { PhoneSky } from "@/components/sky/phone-sky";

/**
 * The scenes of /dev/friend-games: each piece in a whole chat screen, with
 * the words around it in the demo world of the site (docs: the brief's
 * Lina in Lisbon, the Friday river runs, Sam from work, a night owl who
 * would rather text). The chat's sky is the phone's own (PhoneSky) on the
 * app's black (#010101, app/agent.tsx:7673), with the reading veil.
 */

export interface Scene {
  id: string;
  title: string;
  draw: () => ReactNode;
}

const sky = (
  <>
    <div style={{ position: "absolute", inset: 0, background: "#010101" }} />
    <PhoneSky />
  </>
);

function Chat({ children, over }: { children: ReactNode; over?: ReactNode }) {
  return (
    <DeepChat sky={sky} veil over={over}>
      {children}
    </DeepChat>
  );
}

/* Two truths and a lie: the brief's three. */
const TRUTHS: Truth[] = [
  { text: "You run along the river on Fridays", note: "You told me in June, after the 10K." },
  { text: "You wake up at 6 every day", lie: true, note: "Made that up. You'd never wake at 6." },
  { text: "Your sister Lina lives in Lisbon", note: "She moved there in March." },
];

function TruthsChat({ children }: { children: ReactNode }) {
  return (
    <Chat>
      <MyBubble text="how are you doing" />
      <Turn>
        <KrovviBubbles lines={["Doing well, thanks for asking.", "Your Northline interview is at 2 today.", "Want a reminder at 1?"]} />
      </Turn>
      <MyBubble text="play something with me" />
      <Turn>
        <KrovviBubbles lines={["Two truths and a lie, about you 👀", "One of these I made up."]} />
        {children}
      </Turn>
    </Chat>
  );
}

/* This or That: the capture's first card, and the demo world's night owl. */
const COFFEE: Pair = { a: { emoji: "☕", label: "Coffee" }, b: { emoji: "🍵", label: "Tea" }, guess: "a" };
const OWL: Pair = { a: { emoji: "🦉", label: "Night owl" }, b: { emoji: "🐦", label: "Early bird" }, guess: "a" };

function TotChat({ children, after }: { children: ReactNode; after?: ReactNode }) {
  return (
    <Chat>
      <Turn>
        <KrovviBubbles lines={["Doing well, thanks for asking.", "Your Northline interview is at 2 today.", "Want a reminder at 1?"]} />
      </Turn>
      <MyBubble text="I'm bored" />
      <Turn>
        <KrovviBubbles lines={["Let's fix that 😄", "Quick round of This or That. Tap one, or swipe toward it."]} />
        {children}
      </Turn>
      {after}
    </Chat>
  );
}

/* Krovvi's questions. */
const SAM = {
  what: "Someone",
  where: "Chat",
  question: "Who is Sam to you?",
  because: "You mentioned him three times this week.",
  quote: "Sam said he would send the contract by Monday.",
  options: ["From work", "A friend", "Family"],
};
const LINA_DINNER = {
  what: "Date",
  where: "Chat",
  question: "Is dinner with Lina on Friday or Saturday?",
  because: "You said both, and I want to remind you on the right day.",
  quote: "Dinner with Lina on the weekend, Friday I think.",
  options: ["Friday", "Saturday"],
};
const NEXT = ["Is dinner with Lina on Friday or Saturday?", "Coffee or tea in the morning?"];

function AsksChat({ children }: { children: ReactNode }) {
  return (
    <Chat>
      <Turn>
        <KrovviText text={"Mona is vegetarian, so **Olive & Fig** works for all three of you. It's ten minutes from Omar's and has a table at 8."} />
        <ActionsRow items={["copy", "share"]} />
      </Turn>
      <Turn>
        <KrovviBubbles lines={["Got a few quick ones for you 🙂"]} />
        {children}
      </Turn>
    </Chat>
  );
}

export const SCENES: Scene[] = [
  {
    id: "truths-pick",
    title: "Two truths and a lie: tap the lie",
    draw: () => (
      <TruthsChat>
        <TwoTruths statements={TRUTHS} stage="pick" />
      </TruthsChat>
    ),
  },
  {
    id: "truths-revealed",
    title: "Two truths and a lie: turned over",
    draw: () => (
      <TruthsChat>
        <TwoTruths statements={TRUTHS} stage="revealed" picked={1} />
      </TruthsChat>
    ),
  },
  {
    id: "truths-marked",
    title: "Two truths and a lie: both marked",
    draw: () => (
      <TruthsChat>
        <TwoTruths statements={TRUTHS} stage="revealed" picked={1} marks={[true, null, true]} />
      </TruthsChat>
    ),
  },
  {
    id: "truths-flip",
    title: "Two truths and a lie: the turn over (moving)",
    draw: () => (
      <TruthsChat>
        <TwoTruths statements={TRUTHS} stage="revealed" picked={1} flip />
      </TruthsChat>
    ),
  },
  {
    id: "truths-folded",
    title: "Two truths and a lie: played",
    draw: () => (
      <Chat>
        <MyBubble text="play something with me" />
        <Turn>
          <KrovviBubbles lines={["Two truths and a lie, about you 👀", "One of these I made up."]} />
          <GameFolded text="Two truths and a lie · You caught it" />
          <div style={{ padding: "0 4px", marginTop: 2 }}>
            <GameQuiet label="Your turn" />
          </div>
        </Turn>
        <MyBubble text={"My pick for the lie: “You wake up at 6 every day”"} />
        <Turn>
          <KrovviBubbles lines={["You got me 😄", "I'll keep the river runs, and I won't plan anything for you before 8."]} />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "tot-card",
    title: "This or That: the card to swipe",
    draw: () => (
      <TotChat>
        <ThisOrThat pair={COFFEE} at={1} total={10} line="I already guessed each of yours 😏" />
      </TotChat>
    ),
  },
  {
    id: "tot-lean",
    title: "This or That: pulled toward Tea",
    draw: () => (
      <TotChat>
        <ThisOrThat pair={COFFEE} at={1} total={10} pull={46} line="I already guessed each of yours 😏" />
      </TotChat>
    ),
  },
  {
    id: "tot-chosen",
    title: "This or That: picked, and Krovvi's guess",
    draw: () => (
      <TotChat>
        <ThisOrThat pair={OWL} at={2} total={10} chosen="a" line="I already guessed each of yours 😏" />
      </TotChat>
    ),
  },
  {
    id: "tot-next",
    title: "This or That: the next card dealt (moving)",
    draw: () => (
      <TotChat>
        <ThisOrThat pair={OWL} at={2} total={10} arrive leaving={{ pair: COFFEE, chosen: "a" }} line="I already guessed each of yours 😏" />
      </TotChat>
    ),
  },
  {
    id: "tot-done",
    title: "This or That: the round folded",
    draw: () => (
      <TotChat
        after={
          <>
            <MyBubble text="Coffee, Night owl, Mountains, Text, Wing it, Cook, Podcasts, Sunset…" />
            <Turn>
              <KrovviBubbles lines={["Ha, I knew you were a night owl 🦉", "Didn't see the mountains coming though.", "I'll remember you'd rather text than call."]} />
            </Turn>
          </>
        }
      >
        <GameFolded text="This or That · I read you right 5 of 10" marks={[true, false, true, false, false, false, true, false, true, true]} />
      </TotChat>
    ),
  },
  {
    id: "tot-done-live",
    title: "This or That: folding, the dots light (moving)",
    draw: () => (
      <TotChat>
        <GameFolded text="This or That · I read you right 5 of 10" marks={[true, false, true, false, false, false, true, false, true, true]} live />
      </TotChat>
    ),
  },
  {
    id: "asks",
    title: "Krovvi's questions: 1 of 3",
    draw: () => (
      <AsksChat>
        <AskStack label="1 of 3" next={NEXT}>
          <AskCard {...SAM} tip />
        </AskStack>
      </AsksChat>
    ),
  },
  {
    id: "asks-picked",
    title: "Krovvi's questions: one tap answer lit",
    draw: () => (
      <AsksChat>
        <AskStack label="1 of 3" next={NEXT}>
          <AskCard {...SAM} tip picked={0} />
        </AskStack>
      </AsksChat>
    ),
  },
  {
    id: "asks-2",
    title: "Krovvi's questions: 2 of 3",
    draw: () => (
      <AsksChat>
        <AskStack label="2 of 3" next={NEXT.slice(1)}>
          <AskCard {...LINA_DINNER} />
        </AskStack>
      </AsksChat>
    ),
  },
  {
    id: "asks-next",
    title: "Krovvi's questions: answered, the next one comes (moving)",
    draw: () => (
      <AsksChat>
        <AskStack label="2 of 3" next={NEXT.slice(1)} arrive leaving={<AskCard {...SAM} tip picked={0} />}>
          <AskCard {...LINA_DINNER} />
        </AskStack>
      </AsksChat>
    ),
  },
  {
    id: "asks-typed",
    title: "Krovvi's questions: an answer in words",
    draw: () => (
      <AsksChat>
        <AskStack label="1 of 3" next={NEXT}>
          <AskCard {...SAM} answer="He runs the Northline account" />
        </AskStack>
      </AsksChat>
    ),
  },
  {
    id: "asks-later",
    title: "Krovvi's questions: Not now",
    draw: () => (
      <AsksChat>
        <AskFold text="Later 👌" live />
      </AsksChat>
    ),
  },
  {
    id: "asks-done",
    title: "Krovvi's questions: all answered",
    draw: () => (
      <AsksChat>
        <AskFold text="All 3 answered" check live />
      </AsksChat>
    ),
  },
  {
    id: "guess-won",
    title: "Guess what I'm thinking: found",
    draw: () => (
      <Chat>
        <MyBubble text="Yes" />
        <Turn>
          <KrovviBubbles lines={["Interesting."]} />
          <GuessStep count="4 of 20" question="Is it taller than a person?" answer="Yes" />
        </Turn>
        <MyBubble text="Yes" />
        <Turn>
          <KrovviBubbles lines={["Hmm 🤔"]} />
          <GuessStep count="5 of 20" question="Is it a giraffe?" answer="Yes" />
        </Turn>
        <MyBubble text="Yes, that's it!" />
        <Turn>
          <KrovviBubbles lines={["Got it! 🦒"]} />
          <GuessWon word="A giraffe" steps={5} />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "guess-question",
    title: "Guess what I'm thinking: a question",
    draw: () => (
      <Chat>
        <Turn>
          <KrovviBubbles lines={["Oh I love this one.", "Think of something, and I'll find it in 20 questions."]} />
        </Turn>
        <MyBubble text="Got one" />
        <Turn>
          <KrovviBubbles lines={["Hmm 🤔"]} />
          <GuessStep count="1 of 20" question="Is it alive?" answer="Yes" />
        </Turn>
        <MyBubble text="Yes" />
        <Turn>
          <KrovviBubbles lines={["Interesting."]} />
          <GuessQuestion question="Is it an animal?" count="2 of 20" />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "trivia",
    title: "Quick trivia: a wrong answer",
    draw: () => (
      <Chat>
        <MyBubble text="quiz me on space" />
        <Turn>
          <KrovviBubbles lines={["Five on space, since you've been reading about Mars 🚀"]} />
          <Trivia
            topic="Space"
            at={1}
            total={5}
            chosen={0}
            clock={0.8}
            question={{ q: "Which planet is the largest?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1, why: "Jupiter is more than twice the mass of all the other planets together." }}
          />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "emoji",
    title: "Emoji riddles",
    draw: () => (
      <Chat>
        <MyBubble text="how are you doing" />
        <Turn>
          <KrovviBubbles lines={["Doing well, thanks for asking.", "Your Northline interview is at 2 today.", "Want a reminder at 1?"]} />
        </Turn>
        <MyBubble text="emoji riddles!" />
        <Turn>
          <KrovviBubbles lines={["Five films and sayings in emoji. Type what you think."]} />
          <EmojiRiddle emoji="🦁👑" kind="A film" at={1} total={5} />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "shelf",
    title: "The games shelf",
    draw: () => (
      <Chat>
        <Turn>
          <KrovviBubbles lines={["Your Northline interview is at 2 today.", "Want a reminder at 1?"]} />
        </Turn>
        <MyBubble text="I'm bored, let's play something" />
        <Turn>
          <KrovviBubbles lines={["Pick one 👇"]} />
          <GameShelf />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "shelf-played",
    title: "The shelf, picked: its line, and the game dealt",
    draw: () => (
      <Chat>
        <MyBubble text="I'm bored, let's play something" />
        <Turn>
          <KrovviBubbles lines={["Pick one 👇"]} />
          <GameFolded text="Play something · This or That" chevron={false} />
        </Turn>
        <MyBubble text="Let's play This or That" />
        <Turn>
          <KrovviBubbles lines={["Yes! Let's play 🎲", "Here you go."]} />
          <ThisOrThat pair={COFFEE} at={1} total={10} line="I already guessed each of yours 😏" />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "plus-play",
    title: "The + sheet with Play",
    draw: () => (
      <Chat over={<PlusSheetWithPlay />}>
        <MyBubble text="I'm bored, let's play something" />
        <Turn>
          <KrovviBubbles lines={["Pick one 👇"]} />
          <GameFolded text="Play something · This or That" chevron={false} />
        </Turn>
        <MyBubble text="Let's play This or That" />
        <Turn>
          <KrovviBubbles lines={["Yes! Let's play 🎲", "Here you go."]} />
          <ThisOrThat pair={COFFEE} at={1} total={10} line="I already guessed each of yours 😏" />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "play-sheet",
    title: "Play: the shelf in its own sheet",
    draw: () => (
      <Chat over={<GamesSheet />}>
        <MyBubble text="I'm bored, let's play something" />
        <Turn>
          <KrovviBubbles lines={["Pick one 👇"]} />
          <GameFolded text="Play something · This or That" chevron={false} />
        </Turn>
        <MyBubble text="Let's play This or That" />
        <Turn>
          <KrovviBubbles lines={["Yes! Let's play 🎲", "Here you go."]} />
          <ThisOrThat pair={COFFEE} at={1} total={10} line="I already guessed each of yours 😏" />
        </Turn>
      </Chat>
    ),
  },
  {
    id: "shelf-live",
    title: "The games shelf, its marks alive (moving)",
    draw: () => (
      <Chat>
        <MyBubble text="I'm bored, let's play something" />
        <Turn>
          <KrovviBubbles lines={["Pick one 👇"]} />
          <GameShelf live />
        </Turn>
      </Chat>
    ),
  },
];
