import type { ReactNode } from "react";

import {
  ActionsRow,
  AddItem,
  AppPage,
  AppsHome,
  B,
  BrickChecklist,
  BrickNumber,
  BrickProgress,
  BrickRows,
  BrickScreen,
  BrickStats,
  BrickTable,
  BrickTimeline,
  Callout,
  Choices,
  Composer,
  DateLine,
  DeepChat,
  KrovviBubbles,
  KrovviText,
  MoveHeader,
  MyBubble,
  P,
  PageGroup,
  TaskItem,
  Turn,
  PlusSheet,
  ShareSheet,
  ShareTurn,
  StackLine,
  Working,
} from "@/components/deep";

/**
 * A still star field for this review page only, so the pieces are seen over
 * something like the sky (the lead draws the real, live one). Three depths at
 * the counts and sizes of the app's sky (catch8 src/lib/sky/stars.ts DEPTH),
 * placed by a fixed seed, one path per depth and brightness.
 */
function DevSky({ seed = 7 }: { seed?: number }) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const area = (393 * 852) / 100000;
  const depths = [
    { n: Math.round(143 * area), r: [0.35, 0.6], a: [0.07, 0.22] },
    { n: Math.round(38.5 * area), r: [0.6, 0.95], a: [0.22, 0.55] },
    { n: Math.round(9.1 * area), r: [1, 1.55], a: [0.55, 0.9] },
  ];
  const groups: Array<{ a: number; d: string; glow?: boolean }> = [];
  depths.forEach((depth, k) => {
    const buckets = new Map<number, string>();
    for (let i = 0; i < depth.n; i += 1) {
      const x = rand() * 393;
      const y = rand() * 852;
      const r = depth.r[0] + rand() * (depth.r[1] - depth.r[0]);
      const a = Math.round((depth.a[0] + rand() * (depth.a[1] - depth.a[0])) * 10) / 10;
      const c = `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
      buckets.set(a, (buckets.get(a) ?? "") + c);
    }
    for (const [a, d] of buckets) groups.push({ a, d, glow: k === 2 });
  });
  return (
    <svg width="393" height="852" viewBox="0 0 393 852" style={{ position: "absolute", inset: 0, display: "block", background: "#020202" }} aria-hidden="true">
      {groups.map((g, i) => (
        <path key={i} d={g.d} fill="#EDEDEB" opacity={g.a} />
      ))}
    </svg>
  );
}

export interface Scene {
  id: string;
  title: string;
  draw: () => ReactNode;
}

const sky = <DevSky />;

export const SCENES: Scene[] = [
  {
    id: "move",
    title: "Krovvi talks first, with one tap answers",
    draw: () => (
      <DeepChat sky={sky} veil>
        <Turn>
          <KrovviText>
            <P>
              The quote from Omar covers the kitchen and the hall, so <B>the bathroom</B> is the one thing left out.
            </P>
            <P>
              My pick is <B>Omar</B>, with the bathroom added in writing before you sign.
            </P>
          </KrovviText>
          <ActionsRow items={["copy", "share"]} />
        </Turn>
        <Turn>
          <MoveHeader text="Your review with Sara" kind="thread" />
          <KrovviBubbles lines={["Hey! Today was the review with Sara, right?", "How did it go? 🙂"]} />
          <Choices options={["It went great 🎉", "It was okay", "Not great, honestly"]} />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "home",
    title: "Home: the apps behind the chat",
    draw: () => <AppsHome sky={sky} day="Saturday" date="10 October" name="Mona" apps={{ habits: { line: "1 of 5 today" }, money: { lit: true } }} />,
  },
  {
    id: "typing",
    title: "Typing, and Krovvi at work",
    draw: () => (
      <DeepChat sky={sky} veil footer={<Working />} composer={<Composer text="And can you put dinner with Lina on Friday" caret />}>
        <DateLine day="Today" time="6:36 pm" />
        <MyBubble text="Is it Lina's birthday this week?" />
      </DeepChat>
    ),
  },
  {
    id: "listening",
    title: "Listening",
    draw: () => (
      <DeepChat sky={sky} veil composer={<Composer listening clock="0:04" />}>
        <DateLine day="Today" time="8:10 am" />
        <MyBubble text="Gym this week?" />
        <Turn>
          <KrovviText text={"Three so far: **Monday**, **Wednesday** and **Thursday**. Saturday would make it four, your best week since May."} />
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "plus",
    title: "The + sheet",
    draw: () => (
      <DeepChat sky={sky} veil over={<PlusSheet />}>
        <DateLine day="Today" time="9:12 am" />
        <MyBubble text="Here's the quote from the contractor" />
        <Turn>
          <KrovviBubbles lines={["Send it over, I'll read it 👀"]} />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "share",
    title: "Sharing a chat",
    draw: () => (
      <DeepChat
        sky={sky}
        veil
        over={
          <ShareSheet title="Dinner on Friday" cardSky={<DevSky seed={23} />}>
            <ShareTurn date={{ day: "Today", time: "7:40 pm" }} asked="Dinner with Karim and Lina on Friday. Where should we go?" answer={"Lina doesn't eat meat and Karim is off sugar this month, so **Olive & Fig** works for both. It's ten minutes from you and has a table at 8."} />
            <ShareTurn asked="Book it for four" bubbles={["Done, Friday at 8 for four 🎉", "I'll remind you Friday afternoon."]} />
          </ShareSheet>
        }
      >
        <DateLine day="Today" time="7:40 pm" />
        <MyBubble text="Dinner with Karim and Lina on Friday. Where should we go?" />
        <Turn>
          <KrovviText text={"Lina doesn't eat meat and Karim is off sugar this month, so **Olive & Fig** works for both. It's ten minutes from you and has a table at 8."} />
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "screen",
    title: "A screen in an answer: number and progress",
    draw: () => (
      <DeepChat sky={sky} veil>
        <DateLine day="Today" time="6:36 pm" />
        <MyBubble text="If I put away 300 a month, when can I go to Lisbon?" />
        <Turn>
          <KrovviText>
            <P>
              With $2,400 saved and $300 a month, you&apos;d have the $6,000 by <B>June 2027</B>.
            </P>
            <BrickScreen title="Saving for Lisbon" label="You'd have it by">
              <BrickNumber value="June 2027" note="12 months from now" />
              <BrickProgress value="$2,400" rest="of $6,000" share={0.4} pace={0.5} paceLabel="Today" verdict={{ amount: "$600", words: " under an even pace", trend: "down", good: false }} />
            </BrickScreen>
          </KrovviText>
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "stats",
    title: "A stats card and a tip",
    draw: () => (
      <DeepChat sky={sky} veil>
        <MyBubble text="Is the new flat worth it?" />
        <Turn>
          <KrovviText>
            <BrickStats
              stats={[
                { label: "Rent", value: "1,450", note: "a month" },
                { label: "Deposit", value: "2,900", note: "once" },
                { label: "Two years", value: "35,670", note: "with the rise" },
              ]}
            />
            <P>Rents on that street rose about 6% this year, so the offer is close to the going rate.</P>
            <Callout kind="tip">
              <P>Ask for the kitchen repair to be written into the lease.</P>
            </Callout>
            <P>
              My pick is <B>the new flat</B>, with the rise in writing before you sign.
            </P>
          </KrovviText>
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "lists",
    title: "A list and a table",
    draw: () => (
      <DeepChat sky={sky} veil>
        <MyBubble text="Which contractor's quote should I take?" />
        <Turn>
          <KrovviText>
            <P>Three quotes for the bathroom. Omar is the cheapest that covers the tiles.</P>
            <BrickScreen title="Bathroom quotes">
              <BrickRows
                rows={[
                  { title: "Omar Builders", detail: "Tiles and fittings, 3 weeks", value: "$4,800", pick: true },
                  { title: "Karim & Sons", detail: "Fittings only, 2 weeks", value: "$4,150" },
                  { title: "Lina Renovations", detail: "Everything, 5 weeks", value: "$6,300" },
                ]}
              />
              <BrickTable
                label="What each covers"
                headers={["", "Tiles", "Weeks"]}
                rows={[
                  ["Omar", "Yes", "3"],
                  ["Karim", "No", "2"],
                  ["Lina", "Yes", "5"],
                ]}
                pick={0}
              />
            </BrickScreen>
          </KrovviText>
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "plan",
    title: "A plan by day, and a checklist",
    draw: () => (
      <DeepChat sky={sky} veil>
        <MyBubble text="Plan Mona's birthday on Saturday" />
        <Turn>
          <KrovviText>
            <BrickScreen title="Mona's birthday">
              <BrickTimeline
                days={[
                  {
                    day: "Saturday",
                    items: [
                      { time: "4:00", half: "PM", title: "Pick up the cake", detail: "Chocolate, her name on it", place: "Corner bakery" },
                      { time: "7:30", half: "PM", title: "Dinner with friends", detail: "Table for six", place: "Olive & Fig" },
                    ],
                  },
                ]}
              />
              <BrickChecklist
                label="Before Saturday"
                items={[
                  { text: "Book the table", done: true },
                  { text: "Order the cake", hint: "By Thursday" },
                  { text: "Tell Karim and Lina" },
                ]}
              />
            </BrickScreen>
          </KrovviText>
          <ActionsRow />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "attach",
    title: "A photo and a file in the text box",
    draw: () => (
      <DeepChat
        sky={sky}
        veil
        composer={
          <Composer
            text="What does this add up to?"
            attachments={[
              { kind: "file", name: "Quote from Omar.pdf", stage: "ready" },
              { kind: "photo", src: "linear-gradient(135deg, #3a3f4a, #8a7f6e)" },
              { kind: "photo", src: "linear-gradient(160deg, #2f3b33, #a7b39a)" },
            ]}
          />
        }
      >
        <DateLine day="Today" time="10:05 am" />
        <MyBubble text="Rent is due on the 1st, right?" />
        <Turn>
          <KrovviBubbles lines={["Yes, the 1st. 1,450 to Sara as always.", "Want me to remind you on the 30th?"]} />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "match-move",
    title: "Match: fm-first-en (Krovvi asks how it went)",
    draw: () => (
      <DeepChat>
        <Turn>
          <KrovviText>
            <P>Two flats fit what you asked for. The one in Leeds is bigger and closer to work, and the landlord answers fast.</P>
            <P>Rents in Leeds rose about 8% this year, so the offer is close to the going rate.</P>
            <Callout kind="tip">
              <P>Ask for the kitchen repair to be written into the lease.</P>
            </Callout>
            <P>
              My pick is <B>Leeds</B>, with the rise in writing before you sign.
            </P>
          </KrovviText>
          <ActionsRow items={["copy", "share"]} />
        </Turn>
        <Turn>
          <MoveHeader text="Your interview at Northline" kind="thread" />
          <KrovviBubbles lines={["Hey! Today was the Northline interview, right?", "How did it go? 🙂"]} />
          <Choices options={["It went great 🎉", "It was okay", "Not great, honestly"]} />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "match-reply",
    title: "Match: fm-first-c (after a one tap answer)",
    draw: () => (
      <DeepChat>
        <Turn>
          <KrovviText>
            <P>Two flats fit what you asked for. The one in Leeds is bigger and closer to work, and the landlord answers fast.</P>
            <P>Rents in Leeds rose about 8% this year, so the offer is close to the going rate.</P>
            <Callout kind="tip">
              <P>Ask for the kitchen repair to be written into the lease.</P>
            </Callout>
            <P>
              My pick is <B>Leeds</B>, with the rise in writing before you sign.
            </P>
          </KrovviText>
          <ActionsRow items={["copy", "share"]} />
        </Turn>
        <Turn>
          <MoveHeader text="Your interview at Northline" kind="thread" />
          <KrovviBubbles lines={["Hey! Today was the Northline interview, right?", "How did it go? 🙂"]} />
        </Turn>
        <MyBubble text="It went great 🎉" />
        <Turn>
          <KrovviBubbles lines={["Got it.", "I moved Karim to 6 and kept the 9.", "Anything else for tomorrow?"]} />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "match-stats",
    title: "Match: fm-later-b (stats, tip, then Krovvi's line)",
    draw: () => (
      <DeepChat>
        <MyBubble text="Should I take the flat in Leeds or stay where I am?" />
        <Turn>
          <KrovviText>
            <BrickStats
              stats={[
                { label: "Rent", value: "18,000", note: "a month" },
                { label: "Deposit", value: "36,000", note: "once" },
                { label: "Two years", value: "453,600", note: "with the rise" },
              ]}
            />
            <P>Rents in Leeds rose about 8% this year, so the offer is close to the going rate.</P>
            <Callout kind="tip">
              <P>Ask for the kitchen repair to be written into the lease.</P>
            </Callout>
            <P>
              My pick is <B>Leeds</B>, with the rise in writing before you sign.
            </P>
          </KrovviText>
          <ActionsRow items={["copy", "share"]} />
        </Turn>
        <Turn>
          <KrovviBubbles lines={["Got a few quick ones for you 🙂"]} />
          <StackLine text="Later 👌" />
        </Turn>
      </DeepChat>
    ),
  },
  {
    id: "todo",
    title: "An app's page: To-do",
    draw: () => (
      <AppPage title="To-do" tabs={["Today", "Upcoming", "Lists", "Done"]} tab={0}>
        <PageGroup title="1 late" action="Move to today" go={false}>
          <TaskItem first text="Call the dentist" time="Thu 1 Oct" />
        </PageGroup>
        <PageGroup title="Today" value="3">
          <TaskItem first text="Send the deck to Sam" sub="Work" time="3:00 PM" />
          <TaskItem text="Tell Lina about Saturday" />
          <TaskItem text="Review the contract" flagged sub="Work" />
          <AddItem text="Add for today" />
        </PageGroup>
        <PageGroup title="This evening" value="2">
          <TaskItem first text="Take the bins out" sub="Home" time="8:00 PM" />
          <TaskItem text="Water the plants" sub="Home" />
        </PageGroup>
      </AppPage>
    ),
  },
];
