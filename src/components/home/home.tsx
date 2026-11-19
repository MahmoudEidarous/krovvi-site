import { Fragment } from "react";

import { filmUrl, frameOf, hasFilm, hasStill, SCREEN, sizeOf, stillSet, stillUrl } from "@/lib/app-shots";

import { Device, Scene, Shot } from "../look/device";
import { GetKrovvi, LookShell } from "../look/shell";

/**
 * krovvi.com, as the app is on 19 November 2026 (the owner: "the website is very old, the screenshots are outdated ...
 * significantly impressive, from animations to showing the app much better, and showing actual stuff that we have now").
 * Every screen on the page is the real app, taken that day at the phone's own sharpness, and the phones are drawn
 * nearly as big as a phone in the hand.
 *   1. the name huge, and the app in front of it: Krovvi has just texted about your interview; you answer with one tap
 *      and see its real reply, and the page remembers what you said;
 *   2. a friend first: a night sheet slides over, and one phone shows it listening, checking in, cheering, remembering
 *      and keeping your days;
 *   3. it plays: the games themselves, side by side, moving as you scroll;
 *   4. just say it: one real chat you scroll through inside a phone that stays put, each thing you say becoming its own
 *      card (water, skin care, focus, sleep, food, a workout, reading, money, study);
 *   5. the whole picture: the phone swipes between the apps those cards open;
 *   6. the end: the night again, and the phone on a stage under one white light, celebrating your news;
 *   7. the foot, in the same night.
 * The words talk to you about your day, in plain words (the owner's copy rule: your problem, not "Krovvi does X").
 */

/** The three answers Krovvi offers under its check-in, as the app shows them (the bench's lab-site hero scene). */
const PICKS = [
  { id: "great", label: "it went great" },
  { id: "okay", label: "it was okay" },
  { id: "low", label: "not great, honestly" },
];

/** A friend first: each step and the app's screen that shows it. */
const STEPS = [
  {
    c: 1,
    tab: "Vent",
    h: ["Bad day?", "Vent."],
    long: "Tell it everything. It listens, it's on your side, and it won't hand you a list of tips.",
    short: "Tell it everything. It listens, and it's on your side.",
    scene: "vent",
    alt: "You: worst day. my manager just presented my idea to the whole team like it was his. Krovvi: wait, the one you stayed late for all last week? that's not okay. i'd be furious too. do you want to vent, or do you want a distraction?",
  },
  {
    c: 2,
    tab: "Check-ins",
    h: ["It checks", "in on you."],
    long: "After a long week, it asks how you're holding up. Then it helps, like moving tomorrow's early run so you can sleep in.",
    short: "It asks how you're holding up. Then it helps.",
    scene: "checkin",
    alt: "Krovvi: you've had a long week. how are you holding up? You: honestly, tired. Krovvi: then tonight's a couch night. want me to move tomorrow's 7am run to saturday, so you can sleep in?",
  },
  {
    c: 3,
    tab: "Good news",
    h: ["Good news?", "It celebrates with you."],
    long: "Tell it the big thing first. It was there for the nerves, so it's as happy as you are when the call comes.",
    short: "It was there for the nerves, so it's as happy as you are.",
    scene: "news",
    alt: "You: THEY CALLED. I GOT THE JOB. Confetti falls. Krovvi: no way. i knew it. you walked in ready and they saw it. when do you start?",
  },
  {
    c: 4,
    tab: "Memory",
    h: ["Tell it", "once."],
    long: "Say something one time and it remembers. Months later, it brings it up right when it matters.",
    short: "Say it once. Months later, it still remembers.",
    scene: "memory",
    alt: "You: what should i get sara for her birthday? Krovvi: pottery! you told me in june: sara keeps saying she wants to try pottery. there's a beginners class near her on saturday mornings. want the link?",
  },
  {
    c: 5,
    tab: "Your days",
    h: ["It keeps", "your days."],
    long: "Every day you tell it becomes a page of its own, with a picture drawn for it. Go back to any of them.",
    short: "Every day you tell it becomes a page, with its own picture.",
    scene: "days",
    alt: "Days, in Krovvi. A flame for each day of the week. Today: The bank said yes. The flat is happening. Under it, Thursday's page with the picture Krovvi drew for it.",
  },
];

/** It plays: the games as they stand in the app, each in the middle of a round. */
const GAMES = [
  { name: "game-chess-mid", title: "Chess" },
  { name: "game-four-mid", title: "Four in a row" },
  { name: "game-five-mid", title: "Today's word" },
  { name: "game-sudoku-mid", title: "Sudoku" },
  { name: "game-fleet-mid", title: "Sink the fleet" },
  { name: "game-hunt-mid", title: "Word hunt" },
  { name: "game-higher-mid", title: "Higher or lower" },
  { name: "game-groups-mid", title: "Groups" },
  { name: "game-trivia-mid", title: "Trivia" },
  { name: "game-countries-mid", title: "Countries" },
];

/** Just say it: what you said, and what it became. Each picture is the exchange itself, cut out of the app's chat. */
const SAID = [
  { key: "water", name: "Water", line: "A glass, counted. One tap adds the next.", said: "just had a glass of water" },
  { key: "skin", name: "Skin care", line: "Your routine, a tap for each step.", said: "did my cleanser and vitamin c" },
  { key: "focus", name: "Focus", line: "A timer that starts when you say go.", said: "focus 25 minutes on my essay" },
  { key: "sleep", name: "Sleep", line: "Last night, kept with your week.", said: "slept at 11:40, up at 6:50" },
  { key: "meal", name: "Food", line: "Lunch, with its numbers worked out.", said: "had a chicken wrap for lunch" },
  { key: "fitness", name: "Workouts", line: "Today's session, and your week so far.", said: "did 45 minutes of yoga" },
  { key: "reading", name: "Reading", line: "Your pages, against what you aimed for.", said: "read 12 pages of dune" },
  { key: "money", name: "Money", line: "What you spent, and what's left.", said: "cinema was 21.75, and 33.55 at zara" },
  { key: "study", name: "Study", line: "Flashcards, made from your course.", said: "make me flashcards for linkage" },
  { key: "shop", name: "Shopping", line: "Found in real shops, in your size.", said: "i need running shoes for my daily road runs. i wear 43" },
];

/**
 * The whole picture: the apps those cards open, each the app's own page, and the app's own colour for its ground. In an
 * order that never puts two colours of one family side by side.
 */
export const APPS = [
  { name: "page-money", title: "Money", line: "Your month, your bills, and what's left.", tone: "#0A7F8E" },
  { name: "page-shopping", title: "Shopping", line: "Your wish lists: the photo, the price, the shop.", tone: "#D8402F" },
  { name: "page-study", title: "Study", line: "Your exams, your notes, your cards.", tone: "#2D62E6" },
  { name: "page-health", title: "Health", line: "Sleep, medicine, and how you feel.", tone: "#D8437B" },
  { name: "page-habits-own", title: "Habits", line: "The small things you keep, day by day.", tone: "#7250EA" },
  { name: "page-food", title: "Food", line: "Your day on a plate, and your water.", tone: "#259240" },
  { name: "page-todo-own", title: "To-do", line: "Today, and what can wait.", tone: "#5B49F2" },
  { name: "page-library", title: "Library", line: "Your recordings, files and photos, kept.", tone: "#E07B16" },
];

/** A title in lines, each rising from under its own edge. */
function Rise({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="m">
            <span>{l}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** The first screen's name, one span per letter, so it can rise letter by letter. */
function Letters({ text, from }: { text: string; from: number }) {
  return (
    <>
      {[...text].map((c, i) =>
        c === " " ? (
          " "
        ) : (
          <span key={i} className="ch" style={{ "--i": from + i } as React.CSSProperties}>
            {c}
          </span>
        )
      )}
    </>
  );
}

/** A length in the phone's own points (look.css --u). */
const u = (points: number) => `calc(var(--u) * ${points})`;

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-in" id="heroIn">
        <h1 className="atitle" id="atitle" aria-label="Krovvi, your super friend.">
          <span className="ln" aria-hidden="true">
            <Letters text="your super" from={0} />
          </span>{" "}
          <span className="ln" aria-hidden="true">
            <Letters text="friend." from={10} />
          </span>
        </h1>
        <div className="hero-ph" id="heroPh">
          <Device>
            <div className="sc on" id="heroScr" data-show="a">
              {hasStill("hero") && (
                <img
                  className="sc-a"
                  src={stillUrl("hero")}
                  srcSet={stillSet("hero")}
                  sizes="(max-width: 860px) 86vw, 420px"
                  alt="Krovvi, the app. Last night you said: big interview tomorrow. kinda nervous. Today Krovvi texts first: hey. you made it through. how did the interview go?"
                  width={SCREEN.w}
                  height={SCREEN.h}
                  fetchPriority="high"
                  decoding="async"
                  data-shot="hero"
                />
              )}
              <video className="sc-v" muted playsInline preload="none" aria-hidden="true" tabIndex={-1} />
              <img className="sc-e" alt="" width={SCREEN.w} height={SCREEN.h} decoding="async" />
              {PICKS.map((p) => {
                const fr = frameOf(`hero-${p.id}`);
                if (!fr) return null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="hs"
                    data-pick={p.id}
                    aria-label={`Answer Krovvi: ${p.label}`}
                    style={{ left: u(fr.x), top: u(fr.y), width: u(fr.width), height: u(fr.height) }}
                  >
                    <i />
                  </button>
                );
              })}
            </div>
          </Device>
        </div>
        <p className="asub">It listens, checks in and keeps you company. And it looks after your water, your money, your studying and your plans, all in one chat.</p>
        <div className="acta">
          <GetKrovvi />
          <span className="hfor">For iPhone</span>
        </div>
        <i className="shade" aria-hidden="true" />
      </div>
    </section>
  );
}

function Friend() {
  return (
    <section className="fr sheet" id="friend" data-mode="dark" aria-label="A friend first">
      <div className="fr-track" id="frTrack">
        <div className="fr-pin" id="frPin" data-c="0">
          <div className="fr-words" id="frWords">
            <div className="fw mid on" data-c="0">
              <h2 className="fh">
                <Rise lines={["A friend", "first."]} />
              </h2>
              <p className="fl">You don&apos;t open a friend&apos;s chat for a task. You open it all day.</p>
            </div>
            {STEPS.map((s) => (
              <div key={s.c} className="fw" data-c={s.c}>
                <h2 className="fh">
                  <Rise lines={s.h} />
                </h2>
                <p className="fl">
                  <span className="long">{s.long}</span>
                  <span className="short">{s.short}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="fr-ph" id="frPh">
            <Device>
              {STEPS.map((s) => (
                <Scene key={s.c} name={s.scene} alt={s.alt} />
              ))}
            </Device>
          </div>
          <div className="fr-steps" id="frSteps" role="group" aria-label="A friend first">
            <i className="fs-hl" aria-hidden="true" />
            {STEPS.map((s) => (
              <button key={s.c} type="button" data-c={s.c}>
                {s.tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Play() {
  return (
    <section className="pl" id="play" data-mode="dark" aria-label="Games">
     <div className="pl-in" id="plIn">
      <div className="pl-head">
        <h2 className="pl-h rise" data-in>
          <Rise lines={["Bored?", "Play."]} />
        </h2>
        <p className="pl-p fade" data-in>
          Twenty games, and Krovvi is the other player. Chess, four in a row, a new word every day.
        </p>
      </div>
      <div className="pl-rail" id="plRail">
        <div className="pl-row" id="plRow">
          {GAMES.map((g) =>
            hasStill(g.name) ? (
              <figure key={g.name} className="pl-card">
                <div className="pl-scr">
                  <Shot name={g.name} alt={`${g.title}, a game in Krovvi, in the middle of a round.`} sizes="(max-width: 860px) 56vw, 300px" />
                </div>
                <figcaption>{g.title}</figcaption>
              </figure>
            ) : null
          )}
        </div>
      </div>
      <i className="shade" aria-hidden="true" />
     </div>
    </section>
  );
}

function Said() {
  return (
    <section className="say sheet" id="chat" aria-label="Just say it">
      <div className="say-head">
        <h2 className="say-h rise" data-in>
          <Rise lines={["Just", "say it."]} />
        </h2>
        <p className="say-p fade" data-in>
          No forms. No apps to open. Tell Krovvi the way you&apos;d tell a friend, and it&apos;s counted, kept and ready to tap.
        </p>
      </div>
      <div className="say-in">
        <div className="say-side l">
          <div className="say-now" id="sayNow" aria-hidden="true">
            {SAID.map((x, i) => (
              <div key={x.key} className={`sn${i === 0 ? " on" : ""}`} data-x={x.key}>
                <b>{x.name}</b>
                <span>{x.line}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="say-col" id="sayCol">
          <div className="say-gate" aria-hidden="true">
            <div className="say-dev">
              <i className="dev-btn l b-act" />
              <i className="dev-btn l b-vu" />
              <i className="dev-btn l b-vd" />
              <i className="dev-btn r b-pw" />
              <i className="dev-btn r b-cc" />
              <div className="say-hole">
                {hasStill("chrome-top") && <img className="say-top" src={stillUrl("chrome-top")} srcSet={stillSet("chrome-top")} sizes="(max-width: 860px) 100vw, 420px" alt="" decoding="async" data-shot="chrome-top" />}
                {hasStill("chrome-bot") && <img className="say-bot" src={stillUrl("chrome-bot")} srcSet={stillSet("chrome-bot")} sizes="(max-width: 860px) 100vw, 420px" alt="" decoding="async" data-shot="chrome-bot" />}
              </div>
              <i className="say-ring" />
              <i className="say-ring t" />
              <i className="say-drop" />
            </div>
          </div>
          <ol className="say-feed" id="sayFeed">
            {SAID.map((x) => {
              const size = sizeOf(`x-${x.key}`);
              if (!size || !hasStill(`x-${x.key}`)) return null;
              return (
                <li key={x.key} data-x={x.key}>
                  <span className="say-tag" aria-hidden="true">
                    <b>{x.name}</b>
                    <span>{x.line}</span>
                  </span>
                  <div className="say-x" style={{ aspectRatio: `${size.w} / ${size.h}` }}>
                    <img
                      src={stillUrl(`x-${x.key}`)}
                      srcSet={stillSet(`x-${x.key}`)}
                      sizes="(max-width: 860px) 100vw, 420px"
                      alt={`You: ${x.said}. Krovvi answers, and under its reply is your ${x.name} card. ${x.line}`}
                      width={size.w}
                      height={size.h}
                      loading="lazy"
                      decoding="async"
                      data-shot={`x-${x.key}`}
                    />
                    {/* the card as it moves in the app (a step ticked, a glass added, a timer running), over its picture */}
                    {hasFilm(`x-${x.key}`) && <video muted playsInline preload="none" data-src={filmUrl(`x-${x.key}`)} data-film={`x-${x.key}`} aria-hidden="true" tabIndex={-1} />}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="say-side r">
          <ol className="say-index" id="sayIndex" aria-label="What you can just say">
            <i className="si-hl" aria-hidden="true" />
            {SAID.map((x, i) => (
              <li key={x.key} className={i === 0 ? "on" : ""} data-x={x.key} role="button" tabIndex={0}>
                {x.name}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Apps() {
  return (
    <section className="ap sheet" id="apps" data-mode="dark" aria-label="The whole picture" style={{ "--t0": APPS[0].tone } as React.CSSProperties}>
      <div className="ap-track" id="apTrack">
        <div className="ap-pin" id="apPin">
          <div className="ap-tones" id="apTones" aria-hidden="true">
            {APPS.map((a) => (
              <i key={a.name} style={{ "--t": a.tone } as React.CSSProperties} />
            ))}
          </div>
          <div className="ap-in">
            <div className="ap-copy">
              <h2 className="ap-h">Want the whole picture?</h2>
              <p className="ap-p">Every card opens a place of its own.</p>
              <div className="ap-names" id="apNames">
                {APPS.map((a, i) => (
                  <div key={a.name} className={`an${i === 0 ? " on" : ""}`}>
                    <h3>
                      <span className="m">
                        <span>{a.title}</span>
                      </span>
                    </h3>
                    <p>{a.line}</p>
                  </div>
                ))}
              </div>
              <ol className="ap-dots" id="apDots" aria-label="Krovvi's apps">
                {APPS.map((a, i) => (
                  <li key={a.name} className={i === 0 ? "on" : ""} data-i={i} role="button" tabIndex={0} aria-label={a.title}>
                    {a.title}
                  </li>
                ))}
              </ol>
            </div>
            <div className="ap-deck" id="apDeck">
              {APPS.map((a, i) => (
                <figure key={a.name} className="ap-card" data-i={i} style={{ zIndex: APPS.length - i }}>
                  <Shot name={a.name} alt={`${a.title}, in Krovvi. ${a.line}`} sizes="(max-width: 860px) 62vw, 420px" />
                  <i className="veil" aria-hidden="true" />
                </figure>
              ))}
            </div>
          </div>
          <i className="shade" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function End() {
  return (
    <section className="lt sheet" id="get" data-mode="dark" aria-label="Get Krovvi">
      <div className="lt-room" id="ltRoom">
        <div className="lt-in">
          <div className="lt-copy">
            <h2 className="lt-h">
              <Rise lines={["Say hi to your", "super friend."]} />
            </h2>
            <p className="lt-p">Krovvi is on iPhone. Say hi, tell it about your day, and it takes it from there.</p>
            <div className="lt-cta">
              <GetKrovvi />
              <span className="hfor">For iPhone</span>
            </div>
          </div>
          <div className="lt-stage" id="ltStage">
            <i className="lt-beam" aria-hidden="true" />
            <i className="lt-pool" aria-hidden="true" />
            <div className="lt-aim" id="ltAim">
              <div className="lt-turn">
                <Device>
                  <Scene
                    name="flame"
                    alt="Krovvi, the app, on a good day. You: the bank just called. they said yes to the loan. Krovvi: wait. they said YES? three weeks of waiting and the flat is yours. that is huge. when do you sign? At the top, your flame lights for day 12."
                    className="on"
                    id="ltScr"
                  />
                </Device>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <LookShell home>
      <main>
        <Hero />
        <Friend />
        <Play />
        <Said />
        <Apps />
        <End />
      </main>
    </LookShell>
  );
}
