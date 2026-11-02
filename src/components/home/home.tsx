import { Fragment } from "react";

import { frameOf, hasStill, stillUrl } from "@/lib/app-shots";

import { Device, Scene } from "../look/device";
import { GetKrovvi, LookShell } from "../look/shell";

/**
 * krovvi.com: A2, "the phone" (the owner's pick, 31 October 2026, polished over twelve rounds), with every phone now
 * the real app (the owner, 1 November 2026: "instead of these mockup photos, it should be from within the app").
 *   1. the name huge, and the app in front of it: Krovvi has just texted about your interview; you answer with one tap
 *      and see its real reply, and the page remembers what you said;
 *   2. a friend first: the page goes dark for vent, check-ins, play, memory and friends, all in one phone;
 *   3. then it helps: what's on your mind ticks off as you scroll, while the phone swipes between the app's answers;
 *   4. the end: the night again, and the phone on a stage under one white light, saying hi the way the app does;
 *   5. the foot, in the same night.
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
    tab: "Play",
    h: ["Bored?", "Play."],
    long: "Quick games made from what it knows about you, like two truths and a lie about your own life.",
    short: "Quick games made from what it knows about you.",
    scene: "play",
    alt: "You: i'm bored. Krovvi: two truths and a lie. all about you. You pick the lie, and Krovvi: you got me. you'd never wake up at 6.",
  },
  {
    c: 4,
    tab: "Memory",
    h: ["Tell it", "once."],
    long: "Say something one time and it remembers. Months later, it brings it up when it matters.",
    short: "Say it once. Months later, it still remembers.",
    scene: "memory",
    alt: "You: what should i get sara for her birthday? Krovvi: pottery! you told me in june: sara keeps saying she wants to try pottery. there's a beginners class near her on saturday mornings. want the link?",
  },
  {
    c: 5,
    tab: "Friends",
    h: ["Plans with friends,", "without the back and forth."],
    long: "Plan game night with everyone. It asks them for you, and the plan fills in as they answer.",
    short: "It asks your friends for you. The plan fills in as they answer.",
    scene: "friends",
    alt: "You: plan game night with everyone. Krovvi: done. i asked everyone for you. friday at sam's is winning so far. Under it, the plan, filling in as friends answer.",
  },
];

/** Then it helps: what's on your mind, and the moment the app has it done (each picture is the app's own answer). */
export const TASKS = [
  { name: "help-split", q: "Split the Lisbon trip with everyone", a: "Split by the nights each of you stayed" },
  { name: "help-meals", q: "What's for dinner this week?", a: "Tacos tonight. Everyone said yes." },
  { name: "help-money", q: "Am I spending too much?", a: "On track. Eating out is creeping up." },
  { name: "help-trip", q: "What's left to do for Lisbon?", a: "One tour to confirm, and half the packing" },
  { name: "help-gift", q: "Chip in for Maya's birthday gift", a: "Four of you are in so far" },
  { name: "help-todo", q: "What do I have today?", a: "Six things. Two done already." },
];

const TICK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5.5 12.5l4.2 4.2L18.5 7.5" />
  </svg>
);

/** A title in two lines, each rising from under its own edge. */
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

function Hero() {
  return (
    <section className="st1" id="top">
      <div className="st1-pin">
        <div className="hl" id="heroL">
          <h1 className="atitle" id="atitle" aria-label="Krovvi, your super friend.">
            <span className="ln" aria-hidden="true">
              <Letters text="your super" from={0} />
            </span>{" "}
            <span className="ln" aria-hidden="true">
              <Letters text="friend." from={10} />
            </span>
          </h1>
          <p className="asub">It listens, checks in and keeps you company. And it helps with the plans, the money and the to-do list.</p>
          <div className="slotH" id="slotH">
            <div className="phn" id="heroPh">
              <Device>
                <div className="sc on" id="heroScr" data-show="a">
                  {hasStill("hero") && (
                    <img
                      className="sc-a"
                      src={stillUrl("hero")}
                      alt="Krovvi, the app. Last night you said: big interview tomorrow. kinda nervous. Today Krovvi texts first: hey. you made it through. how did the interview go?"
                      width={390}
                      height={844}
                      fetchPriority="high"
                      decoding="async"
                      data-shot="hero"
                    />
                  )}
                  <video className="sc-v" muted playsInline preload="none" aria-hidden="true" tabIndex={-1} />
                  <img className="sc-e" alt="" width={390} height={844} decoding="async" />
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
                        style={{ left: fr.x, top: fr.y, width: fr.width, height: fr.height }}
                      >
                        <i />
                      </button>
                    );
                  })}
                </div>
              </Device>
            </div>
          </div>
          <div className="acta">
            <GetKrovvi />
            <span className="hfor">For iPhone</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Friend() {
  return (
    <section className="fr2" id="friend" data-mode="dark" aria-label="A friend first">
      <div className="fr2-fade" aria-hidden="true" />
      <div className="fr2-track" id="frTrack">
        <div className="fr2-pin" id="pin2" data-c="0">
          <div className="fws" id="fws">
            <div className="fw2 mid on" data-c="0">
              <h2 className="fh2">
                <Rise lines={["A friend", "first."]} />
              </h2>
              <p className="fl2">You don&apos;t open a friend&apos;s chat for a task. You open it all day.</p>
            </div>
            {STEPS.map((s) => (
              <div key={s.c} className="fw2" data-c={s.c}>
                <h2 className="fh2">
                  <Rise lines={s.h} />
                </h2>
                <p className="fl2">
                  <span className="long">{s.long}</span>
                  <span className="short">{s.short}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="phn" id="frPh">
            <Device>
              {STEPS.map((s) => (
                <Scene key={s.c} name={s.scene} alt={s.alt} className="sc-frame" />
              ))}
              <div className="sc-off" />
            </Device>
          </div>
          <div className="steps2" id="steps2" role="group" aria-label="A friend first">
            <i className="s2-hl" aria-hidden="true" />
            {STEPS.map((s) => (
              <button key={s.c} type="button" data-c={s.c}>
                {s.tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="fr2-out" aria-hidden="true" />
    </section>
  );
}

function Helps() {
  return (
    <section className="hp" id="tasks" aria-label="How it helps">
      <div className="hp-track" id="hpTrack">
        <div className="hp-pin" id="hpPin">
          <div className="hp-copy">
            <h2 className="th">Too much on your mind?</h2>
            <p className="tlead">Then it helps. Text it the way you&apos;d text a friend, and it splits, plans and keeps track.</p>
            <ol className="hp-list" id="hpList" aria-label="Things Krovvi takes off your list">
              <i className="hp-hl" aria-hidden="true" />
              {TASKS.map((t, i) => (
                <li key={t.name} data-i={i}>
                  <span className="hk">{TICK}</span>
                  <span className="ttx">
                    <span className="q">{t.q}</span>
                    <span className="a">{t.a}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="hp-one" id="hpOne" aria-hidden="true">
              <div className="seg6">
                {TASKS.map((t) => (
                  <i key={t.name}>
                    <b />
                  </i>
                ))}
              </div>
              <div className="one" />
            </div>
          </div>
          <div className="hp-slot" id="hpSlot">
            <div className="phn" id="hpPh">
              <Device>
                <div className="hp-view">
                  <div className="hp-strip">
                    {TASKS.map((t, i) =>
                      hasStill(t.name) ? (
                        <img
                          key={t.name}
                          className="hp-shot"
                          src={stillUrl(t.name)}
                          alt={`Krovvi, the app. You: ${t.q}. Krovvi: ${t.a}.`}
                          width={390}
                          height={844}
                          loading="lazy"
                          decoding="async"
                          data-shot={t.name}
                          style={{ left: i * 408 }}
                        />
                      ) : null
                    )}
                  </div>
                </div>
              </Device>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function End() {
  return (
    <section className="lt" id="get" data-mode="dark" aria-label="Get Krovvi">
      <div className="lt-fade" aria-hidden="true" />
      <div className="lt-room" id="ltRoom">
        <div className="lt-in">
          <div className="lt-copy">
            <h2 className="lt-h">
              <Rise lines={["Say hi to your", "super friend."]} />
            </h2>
            <p className="lt-p">Open it and it says hi first. A few quick taps, and you&apos;re friends.</p>
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
                <div className="phn" id="ltPh">
                  <Device>
                    <Scene name="hello" alt="Krovvi, the app, the first time you open it: it says hi first." className="on" id="ltScr" />
                  </Device>
                </div>
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
        <Helps />
        <End />
      </main>
    </LookShell>
  );
}
