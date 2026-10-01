import { an } from "@/lib/anim";
import { Card, Check, Divider, DotInitial, NavCircle, Play, StatusBar } from "./ui";

/** The top of a recording's page: back, title, and the Note / Transcript switch. */
function NoteTop() {
  return (
    <>
      <StatusBar />
      <div className="absolute inset-x-[18px] top-[58px] flex justify-between">
        <NavCircle icon="back" />
        <NavCircle icon="more" />
      </div>
      <div className="absolute inset-x-[20px] top-[118px]">
        <div className="text-[30px] font-bold tracking-[-1px] text-ink">Atlas sync</div>
        <div className="mt-[2px] text-[14px] text-faint">Today · 6:17 pm · 31 min</div>
        <div className="mt-[16px] flex h-[42px] rounded-full bg-card p-[3px]">
          <span className="flex flex-1 items-center justify-center rounded-full bg-card-hi text-[15px] font-semibold text-ink">Note</span>
          <span className="flex flex-1 items-center justify-center text-[15px] font-medium text-muted">Transcript</span>
        </div>
      </div>
    </>
  );
}

const CAUGHT: Array<{ kind: string; text: React.ReactNode; at: string; sub?: string }> = [
  { kind: "Task", text: <><b className="font-semibold text-ink">You:</b> Send the new deck with the updated numbers</>, at: "3:12", sub: "Due Friday" },
  { kind: "Decision", text: "The Atlas launch moves to October 15", at: "7:40" },
  { kind: "Money", text: "The design budget stays at 40,000", at: "9:05" },
  { kind: "Date", text: "Review on Thursday at 10", at: "11:22" },
];

/** "What I caught": what came out of the conversation, each line one tap from its second. */
export function CaughtScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <div className="relative h-full w-full bg-ground">
      <NoteTop />
      <div className="absolute inset-x-[16px] top-[262px]">
        <div className={`${A} mb-[10px] px-[4px] text-[15px] font-semibold text-muted`} style={an("k-fade", 150)}>
          What I caught
        </div>
        <Card className="overflow-hidden">
          {CAUGHT.map((line, i) => (
            <div key={i} className={A} style={an("k-rise", 300 + i * 260, 650)}>
              {i > 0 && <Divider />}
              <div className="flex items-start gap-[12px] px-[16px] py-[12px]">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-faint">{line.kind}</div>
                  <div className="mt-[2px] text-[15.5px] leading-[1.35] tracking-[-0.15px] text-soft">{line.text}</div>
                  {line.sub && <div className="mt-[3px] text-[13px] text-muted">{line.sub}</div>}
                  {i === 0 && (
                    <div className="mt-[8px] h-[3px] w-full overflow-hidden rounded-full bg-card-hi">
                      <div
                        className={`${A} h-full origin-left rounded-full bg-ink`}
                        style={an("k-grow-x", 2100, 2600)}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`mt-[14px] flex items-center gap-[5px] rounded-full px-[9px] py-[4px] text-[12px] text-faint tabular ${i === 0 ? "bg-card-hi text-ink" : ""}`}
                >
                  <Play size={7} />
                  {line.at}
                </span>
              </div>
            </div>
          ))}
        </Card>

        <div className={`${A} mt-[12px]`} style={an("k-pop", 1700, 600)}>
          <Card className="px-[16px] py-[11px]">
            <div className="text-[12px] font-medium text-faint">Noticed</div>
            <div className="mt-[2px] text-[15px] text-soft">A date moved. Moved from October 3 to October 15</div>
          </Card>
        </div>

        <div className={`${A} mt-[16px] flex items-center gap-[12px] px-[4px]`} style={an("k-rise", 2300, 600)}>
          <span className="flex -space-x-[8px]">
            <span className="rounded-full ring-[3px] ring-ground"><DotInitial letter="S" size={34} ink="var(--sand)" /></span>
            <span className="rounded-full ring-[3px] ring-ground"><DotInitial letter="O" size={34} ink="var(--clay)" /></span>
          </span>
          <span className="text-[14px] text-muted">Sara now has 3 things, 1 task due Sunday.</span>
        </div>

        <div className={`${A} mt-[14px]`} style={an("k-pop", 2900, 600)}>
          <Card className="px-[16px] pb-[12px] pt-[13px]">
            <div className="text-[15.5px] font-medium leading-[1.35] tracking-[-0.2px] text-ink">
              Want this ready before you see Sara next?
            </div>
            <div className="mt-[3px] text-[13px] text-muted">What is open with them comes to you before you meet.</div>
            <div className="mt-[10px] flex gap-[8px]">
              <span className="rounded-full bg-ink px-[18px] py-[7px] text-[14px] font-semibold text-ground">Yes</span>
              <span className="rounded-full bg-card-hi px-[16px] py-[7px] text-[14px] font-medium text-ink">Not now</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const AGREED: Array<{ mark: "check" | "dot"; who?: string; text: string; due?: string }> = [
  { mark: "check", text: "The Atlas launch moves to October 15" },
  { mark: "dot", who: "You", text: "Send the new deck with the updated numbers", due: "Friday" },
  { mark: "dot", who: "Sara", text: "Send the final copy for the landing page", due: "Sunday" },
];

/** What you agreed with Sara, sent with one tap, then her answer coming back. */
export function AgreedScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const seq = (steps: string) => (still ? undefined : { animation: steps });
  return (
    <div className="relative h-full w-full bg-ground">
      <NoteTop />
      <div className="absolute inset-x-[16px] top-[262px]">
        <div className="mb-[10px] px-[4px] text-[15px] font-semibold text-muted">What you agreed with Sara</div>
        <Card className="overflow-hidden">
          {AGREED.map((line, i) => (
            <div key={i} className={A} style={an("k-rise", 150 + i * 200, 600)}>
              {i > 0 && <Divider />}
              <div className="flex items-start gap-[12px] px-[16px] py-[13px]">
                <span className="mt-[3px] flex w-[14px] justify-center">
                  {line.mark === "check" ? (
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="#A9A8A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1.5 5.8 5 9.3l7.5-8" />
                    </svg>
                  ) : (
                    <span className="mt-[4px] h-[6px] w-[6px] rounded-full bg-faint" />
                  )}
                </span>
                <span className="flex-1 text-[15.5px] leading-[1.35] tracking-[-0.15px] text-ink">
                  {line.who && <b className="font-semibold">{line.who}: </b>}
                  {line.text}
                </span>
                {line.due && <span className="mt-[1px] text-[13px] text-faint">{line.due}</span>}
                <Play size={7} className="mt-[6px] text-faint" />
              </div>
            </div>
          ))}
          <div className="relative h-[74px] border-t border-line">
            {/* The button, pressed, then gone. */}
            <div
              className="seq transient absolute inset-x-[16px] top-[14px]"
              style={seq("k-press 420ms var(--ease) 1200ms both, k-gone 300ms var(--ease) 1650ms forwards")}
            >
              <span className="flex h-[46px] items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-ground">
                Send to Sara
              </span>
            </div>
            {/* Then what happened to it, one line at a time. */}
            <div
              className="seq transient absolute inset-x-[20px] top-[26px] flex items-center gap-[10px] text-[15px] text-soft"
              style={seq("k-fade 400ms var(--ease) 1900ms both, k-gone 300ms var(--ease) 3000ms forwards")}
            >
              <span className="h-[7px] w-[7px] rounded-full bg-faint" /> Sent to Sara
            </div>
            <div
              className="seq transient absolute inset-x-[20px] top-[26px] flex items-center gap-[10px] text-[15px] text-soft"
              style={seq("k-fade 400ms var(--ease) 3250ms both, k-gone 300ms var(--ease) 4400ms forwards")}
            >
              <span className="h-[7px] w-[7px] rounded-full bg-soft" /> Sara opened it
            </div>
            <div
              className="seq absolute inset-x-[20px] top-[22px] flex items-center gap-[10px] text-[16px] font-semibold text-ink"
              style={seq("k-pop 500ms var(--ease) 4650ms both")}
            >
              <Check done /> Sara confirmed it
            </div>
          </div>
        </Card>
        <div className="mt-[20px] px-[4px] text-[17px] leading-[1.4] text-ink">
          Sara and Sam moved the launch and split the last tasks.
        </div>
        <div className="mt-[8px] px-[4px] text-[15px] leading-[1.45] text-muted">
          The landing page ships a week before the launch. Sara owns the final copy, and Sam sends the new deck.
        </div>
      </div>
    </div>
  );
}

/** The other person's side: a private page in their browser, no app needed. */
export function LinkScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const seq = (steps: string) => (still ? undefined : { animation: steps });
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[24px] top-[74px]">
        <div className="text-[16px] font-semibold tracking-[-0.2px] text-ink">krovvi</div>
        <div className="mt-[34px] text-[26px] font-semibold leading-[1.15] tracking-[-0.8px] text-ink">
          Sam shared what you agreed
        </div>
        <div className="mt-[6px] text-[14px] text-faint">Atlas sync · Saturday</div>
        <div className="mt-[22px] flex flex-col gap-[16px]">
          {AGREED.map((line, i) => (
            <div key={i} className={`${A} flex gap-[12px]`} style={an("k-rise", 250 + i * 180, 600)}>
              <span className="mt-[8px] h-[6px] w-[6px] shrink-0 rounded-full bg-faint" />
              <span className="text-[16px] leading-[1.4] text-ink">
                {line.who && <b className="font-semibold">{line.who === "You" ? "Sam" : "You"}: </b>}
                {line.text}
                {line.due && <span className="text-faint"> · by {line.due}</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-[30px] h-[110px]">
          <div
            className="seq transient absolute inset-x-0 top-0 flex flex-col gap-[10px]"
            style={seq("k-gone 300ms var(--ease) 2100ms forwards")}
          >
            <span
              className="seq flex h-[48px] items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-ground"
              style={seq("k-press 420ms var(--ease) 1500ms both")}
            >
              This is right
            </span>
            <span className="flex h-[48px] items-center justify-center rounded-full bg-card-hi text-[16px] font-medium text-ink">
              Something is off
            </span>
          </div>
          <div
            className="seq absolute inset-x-0 top-[8px] text-[16px] leading-[1.45] text-soft"
            style={seq("k-pop 500ms var(--ease) 2400ms both")}
          >
            <div className="mb-[8px]"><Check done /></div>
            Thanks. Sam will see that you confirmed it.
          </div>
        </div>
        <div className="mt-[56px] border-t border-line pt-[16px] text-[13px] leading-[1.5] text-faint">
          Only these lines were shared, never the conversation itself.
        </div>
      </div>
      {/* Safari's address bar, at the bottom where iPhone keeps it. */}
      <div className="absolute inset-x-[16px] bottom-[34px] flex h-[48px] items-center justify-center gap-[6px] rounded-full bg-card-hi text-[15px] text-soft">
        <svg width="10" height="13" viewBox="0 0 10 13" fill="none" aria-hidden="true">
          <rect x="0.75" y="5.25" width="8.5" height="7" rx="1.6" fill="#A9A8A2" />
          <path d="M2.6 5.3V3.8a2.4 2.4 0 0 1 4.8 0v1.5" stroke="#A9A8A2" strokeWidth="1.4" />
        </svg>
        krovvi.com
      </div>
    </div>
  );
}

/** Before you meet: what is open between you, in one place. */
export function BriefScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute left-[18px] top-[58px]">
        <NavCircle icon="back" />
      </div>
      <div className="absolute inset-x-[20px] top-[118px]">
        <div className={`${A} text-[16px] text-muted`} style={an("k-fade", 100)}>In 25 min · 6:17 pm</div>
        <div className={`${A} mt-[2px] text-[17px] text-soft`} style={an("k-fade", 150)}>Atlas sync</div>
        <div className={`${A} mt-[16px] flex items-center gap-[14px]`} style={an("k-rise", 250)}>
          <DotInitial letter="S" size={54} ink="var(--sand)" />
          <div>
            <div className="text-[26px] font-bold leading-tight tracking-[-0.9px] text-ink">Sara Ali</div>
            <div className="text-[14.5px] text-soft">Sara leads design for the Atlas launch</div>
          </div>
        </div>
        <div className={`${A} mt-[16px] flex gap-[10px]`} style={an("k-rise", 400)}>
          <span className="flex h-[44px] flex-[1.25] items-center justify-center gap-[7px] rounded-full bg-ink text-[15.5px] font-semibold text-ground">
            <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true"><rect x="3" y="0.5" width="6" height="10" rx="3" fill="#0A0A0A" /><path d="M1 8a5 5 0 0 0 10 0M6 13v2.5" stroke="#0A0A0A" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
            Record this meeting
          </span>
          <span className="flex h-[44px] flex-1 items-center justify-center rounded-full bg-card-hi text-[15.5px] font-medium text-ink">
            Ask about Sara
          </span>
        </div>

        <div className={A} style={an("k-rise", 650)}>
          <div className="mt-[22px] flex justify-between px-[2px] text-[14px]">
            <span className="font-semibold text-muted">Last time</span>
            <span className="text-faint">Saturday · 31 min</span>
          </div>
          <Card className="mt-[8px] overflow-hidden">
            <div className="px-[16px] pb-[8px] pt-[13px] text-[15.5px] font-medium text-ink">Atlas design review</div>
            {["Ship the landing page a week before the launch", "Sara owns the final copy"].map((t) => (
              <div key={t}>
                <Divider />
                <div className="flex items-center gap-[12px] px-[16px] py-[11px] text-[15px] text-soft">
                  <Play size={7} className="text-faint" />
                  {t}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div className={A} style={an("k-rise", 900)}>
          <div className="mt-[18px] px-[2px] text-[14px] font-semibold text-muted">You owe Sara</div>
          <Card className="mt-[8px] flex items-start gap-[12px] px-[16px] py-[12px]">
            <Check />
            <span className="flex-1 text-[15.5px] leading-[1.35] text-ink">Send the new deck with the updated numbers</span>
            <span className="text-[13px] text-faint">Friday</span>
          </Card>
        </div>

        <div className={A} style={an("k-rise", 1100)}>
          <div className="mt-[18px] px-[2px] text-[14px] font-semibold text-muted">Sara owes you</div>
          <Card className="mt-[8px] flex items-start gap-[12px] px-[16px] py-[12px]">
            <Check />
            <span className="flex-1 text-[15.5px] leading-[1.35] text-ink">Send the final copy for the landing page</span>
            <span className="text-[13px] text-ink">Sunday</span>
          </Card>
        </div>

        <div className={A} style={an("k-rise", 1300)}>
          <div className="mt-[18px] flex justify-between px-[2px] text-[14px]">
            <span className="font-semibold text-muted">Worth knowing</span>
            <span className="text-faint">Heard Sunday</span>
          </div>
          <Card className="mt-[8px] flex items-center gap-[12px] px-[16px] py-[13px]">
            <span className="h-[6px] w-[6px] rounded-full bg-faint" />
            <span className="text-[15.5px] text-ink">Sara is moving to Dubai in November</span>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** After you meet: one line from you, and what Krovvi changed, each with Undo. */
export function DebriefScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const said = "Sara already sent the final copy. The launch moved again, to October 20.".split(" ");
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute left-[18px] top-[58px]">
        <NavCircle icon="close" />
      </div>
      <div className="absolute inset-x-[20px] top-[124px]">
        <DotInitial letter="S" size={46} ink="var(--sand)" />
        <div className="mt-[14px] text-[29px] font-bold leading-[1.1] tracking-[-1.1px] text-ink">How did it go with Sara?</div>
        <div className="mt-[6px] text-[15px] text-muted">Atlas sync</div>
        <Card className="mt-[18px] px-[16px] py-[14px]">
          <div className="text-[13px] font-medium text-faint">You said</div>
          <div className="mt-[4px] text-[16.5px] leading-[1.4] text-ink">
            {said.map((w, i) => (
              <span key={i} className={A} style={an("k-fade", 300 + i * 120, 300)}>
                {w}{" "}
              </span>
            ))}
          </div>
        </Card>
        <div className={`${A} mt-[24px] text-[21px] font-semibold tracking-[-0.6px] text-ink`} style={an("k-rise", 2100)}>
          Krovvi updated 2 things
        </div>
        <div className={A} style={an("k-pop", 2500)}>
          <Card className="mt-[12px] px-[16px] py-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[14px]"><b className="font-semibold text-ink">New</b> <span className="text-muted">&nbsp;the launch</span></span>
              <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-card-hi px-[12px] text-[14px] font-medium text-ink">
                <Undo /> Undo
              </span>
            </div>
            <div className="mt-[8px] text-[16px] text-ink">
              Launch date is October 20, 2026.
            </div>
          </Card>
        </div>
        <div className={A} style={an("k-pop", 2850)}>
          <Card className="mt-[10px] px-[16px] py-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[14px]"><b className="font-semibold text-ink">Marked done</b> <span className="text-muted">&nbsp;Sara Ali</span></span>
              <span className="flex h-[30px] items-center gap-[6px] rounded-full bg-card-hi px-[12px] text-[14px] font-medium text-ink">
                <Undo /> Undo
              </span>
            </div>
            <div className="mt-[8px] text-[16px] text-muted">Send the final copy for the landing page</div>
          </Card>
        </div>
        <div className={`${A} mt-[22px] flex justify-end gap-[10px]`} style={an("k-fade", 3200)}>
          <span className="rounded-full bg-card-hi px-[20px] py-[11px] text-[16px] font-medium text-ink">Say more</span>
          <span className="rounded-full bg-ink px-[22px] py-[11px] text-[16px] font-semibold text-ground">Done</span>
        </div>
      </div>
    </div>
  );
}

function Undo() {
  return (
    <svg width="13" height="11" viewBox="0 0 14 12" fill="none" stroke="#EDEDEB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 1 1.5 4l3 3" />
      <path d="M1.8 4h6.7a4 4 0 0 1 0 8H5" />
    </svg>
  );
}
