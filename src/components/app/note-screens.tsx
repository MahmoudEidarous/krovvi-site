import { an } from "@/lib/anim";
import { MicGlyph } from "./chat";
import { Card, Check, Divider, PersonFace, NavCircle, Play, StatusBar } from "./ui";

/** The top of a recording's page: back, title, and the Note / Transcript switch. */
function NoteTop() {
  return (
    <>
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[63px] flex justify-between">
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

/** What came out of the conversation, worded as the app words it (understood.tsx). */
const CAUGHT: Array<{ kind: string; lead?: string; text: string; at: string; due?: string }> = [
  { kind: "Task", lead: "You owe Sara", text: "send the new deck with the updated numbers", at: "3:12", due: "Friday" },
  { kind: "Decision", text: "The Atlas launch moves to October 15", at: "7:40" },
  { kind: "Money", text: "The design budget stays at 40,000", at: "9:05" },
];

/** The quiet three dots that open Right / Not right on a caught line. */
function MoreDots() {
  return (
    <span className="flex h-[26px] w-[30px] items-center justify-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-faint" />
      ))}
    </span>
  );
}

/** "What I caught": what came out of the conversation, each line one tap from its second. */
export function CaughtScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <div className="relative h-full w-full bg-ground">
      <NoteTop />
      <div className="absolute inset-x-[16px] top-[262px] flex flex-col gap-[12px]">
        <div className={`${A} px-[4px] text-[12px] uppercase tracking-[1.1px] text-faint`} style={an("k-fade", 150)}>
          What I caught
        </div>
        <Card className="overflow-hidden">
          {CAUGHT.map((line, i) => (
            <div key={i} className={A} style={an("k-rise", 300 + i * 260, 650)}>
              {i > 0 && <Divider />}
              <div className="flex flex-col gap-[6px] px-[16px] pb-[10px] pt-[12px]">
                <div className="mb-[-2px] text-[11px] font-semibold tracking-[0.4px] text-faint">{line.kind}</div>
                <div className="text-[15px] leading-[21.75px] tracking-[-0.15px] text-soft">
                  {line.lead && (
                    <>
                      <b className="font-semibold text-ink">{line.lead}</b>
                      <span className="text-muted">: </span>
                    </>
                  )}
                  {line.text}
                </div>
                <div className="flex min-h-[26px] items-center justify-between">
                  <span className="flex items-center gap-[8px] text-[12px] text-faint tabular">
                    <span className="flex items-center gap-[5px]">
                      <span
                        className="h-0 w-0"
                        style={{ borderTop: "3.5px solid transparent", borderBottom: "3.5px solid transparent", borderLeft: "6px solid #7A7A74" }}
                      />
                      {line.at}
                    </span>
                    {line.due && <span className="text-soft">Due {line.due}</span>}
                  </span>
                  <MoreDots />
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div className={A} style={an("k-pop", 1400, 600)}>
          <Card className="flex flex-col gap-[3px] px-[16px] py-[11px]">
            <div className="text-[12px] font-medium text-faint">Noticed</div>
            <div className="text-[15px] leading-[21px] text-soft">
              <b className="font-semibold text-ink">Moved from October 3 to October 15.</b> The Atlas launch
            </div>
          </Card>
        </div>

        <div className={`${A} flex items-center gap-[10px] px-[4px]`} style={an("k-rise", 1900, 600)}>
          <PersonFace name="Sara Ali" size={22} />
          <span className="text-[14px] text-muted">Sara now has 3 things, 1 task due Friday.</span>
        </div>

        <div className={A} style={an("k-pop", 2400, 600)}>
          <Card className="flex flex-col gap-[6px] pb-[12px] pl-[16px] pr-[12px] pt-[13px]">
            <div className="text-[15.5px] font-medium leading-[21px] tracking-[-0.2px] text-ink">Want this ready before you see Sara next?</div>
            <div className="text-[13px] text-muted">What is open with them comes to you before you meet.</div>
            <div className="mt-[4px] flex items-center justify-end gap-[14px]">
              <span className="text-[14px] font-medium text-soft">Not now</span>
              <span className="flex h-[36px] min-w-[72px] items-center justify-center rounded-[18px] bg-ink px-[16px] text-[15px] font-semibold text-ground">
                Yes
              </span>
            </div>
          </Card>
        </div>

        <div className={`${A} flex gap-[18px] px-[4px]`} style={an("k-rise", 2800, 600)}>
          {["Sara Ali", "Omar"].map((name) => (
            <span key={name} className="flex w-[52px] flex-col items-center gap-[4px]">
              <PersonFace name={name} size={34} />
              <span className="text-[11px] text-faint">{name.split(" ")[0]}</span>
            </span>
          ))}
        </div>
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
      <div className="absolute left-[16px] top-[63px]">
        <NavCircle icon="back" />
      </div>
      <div className="absolute inset-x-[20px] top-[118px]">
        <div className={`${A} text-[16px] text-muted`} style={an("k-fade", 100)}>In 25 min · 6:17 pm</div>
        <div className={`${A} mt-[2px] text-[17px] text-soft`} style={an("k-fade", 150)}>Atlas sync</div>
        <div className={`${A} mt-[16px] flex items-center gap-[14px]`} style={an("k-rise", 250)}>
          <PersonFace name="Sara Ali" size={54} />
          <div>
            <div className="text-[26px] font-bold leading-tight tracking-[-0.9px] text-ink">Sara Ali</div>
            <div className="text-[14.5px] text-soft">Sara leads design for the Atlas launch</div>
          </div>
        </div>
        <div className={`${A} mt-[16px] flex gap-[10px]`} style={an("k-rise", 400)}>
          <span className="flex h-[40px] flex-grow items-center justify-center gap-[8px] rounded-[20px] bg-ink px-[16px] text-[14.5px] font-semibold text-ground">
            <MicGlyph size={13} color="#0A0A0A" weight={1.6} />
            Record this meeting
          </span>
          <span className="flex h-[40px] items-center justify-center gap-[8px] rounded-[20px] bg-card px-[16px] text-[14.5px] font-medium text-ink">
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
