import { an } from "@/lib/anim";
import { Card, Check, Divider, KGlyph, NavCircle, Play, StatusBar } from "./ui";

/** The lock screen, and Krovvi's heads-up arriving on it, above an older one it pushes down. */
export function LockScreen({ still = false, delay = 900, older = true }: { still?: boolean; delay?: number; older?: boolean }) {
  return (
    <div
      className="relative h-full w-full"
      style={{
        background:
          "radial-gradient(120% 70% at 30% 18%, #2a2420 0%, #141211 45%, #0a0a0a 100%)",
      }}
    >
      <StatusBar />
      <div className="absolute inset-x-0 top-[88px] text-center">
        <div className="text-[19px] font-semibold text-ink/85">Thursday 1 October</div>
        <div className="mt-[-4px] text-[96px] font-semibold leading-none tracking-[-3px] text-ink/95 tabular">6:07</div>
      </div>
      <div className="absolute inset-x-[12px] top-[300px] flex flex-col gap-[8px]">
        <div className={still ? "" : "anim"} style={an("k-drop", delay, 800)}>
          <Notification
            title="Seeing Sara at 6:17 PM"
            body="You owe: the new deck with the updated numbers. Sara owes you: the final copy."
          />
        </div>
        {older && (
          <div className={still ? "opacity-70" : "anim opacity-70"} style={an("k-shift", delay, 800, { "--from": "-104px" })}>
            <Notification
              title="Atlas design review"
              body="3 things agreed with Sara. Decided: the launch moves to October 15."
              when="Sat"
            />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-[36px] flex justify-between px-[48px]">
        <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/10 backdrop-blur" />
        <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/10 backdrop-blur" />
      </div>
    </div>
  );
}

export function Notification({ title, body, when = "now" }: { title: string; body: string; when?: string }) {
  return (
    <div className="rounded-[22px] bg-[rgba(52,50,48,0.72)] px-[14px] py-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start gap-[11px]">
        <span className="mt-[1px] flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-ground">
          <KGlyph size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold text-ink">{title}</span>
            <span className="text-[13px] text-ink/50">{when}</span>
          </div>
          <div className="mt-[1px] text-[15px] leading-[1.3] text-ink/85">{body}</div>
        </div>
      </div>
    </div>
  );
}

/** Tasks: yours and theirs, each one tap from where it was said. */
export function TasksScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[58px] flex items-center justify-between">
        <span className="flex items-center gap-[12px]">
          <NavCircle icon="back" />
          <span className="text-[30px] font-bold tracking-[-1px] text-ink">Tasks</span>
        </span>
        <NavCircle icon="plus" />
      </div>
      <div className="absolute inset-x-[16px] top-[124px]">
        <div className="flex h-[42px] w-[260px] rounded-full bg-card p-[3px]">
          <span className="flex flex-1 items-center justify-center rounded-full bg-card-hi text-[15px] font-semibold text-ink">Yours · 3</span>
          <span className="flex flex-1 items-center justify-center text-[15px] font-medium text-muted">Theirs · 2</span>
        </div>
        <div className="mt-[16px] px-[4px] text-[15px] text-muted">Nothing late</div>

        <div className="mt-[18px] px-[4px] text-[15px] font-medium text-muted">Today</div>
        <Card className="mt-[8px]">
          <TaskRow text={<>Send the new deck with the updated numbers for <b className="font-semibold">Sara Ali</b></>} when="Today" said="said Saturday, in a recording" closing={!still} />
        </Card>
        <div className={`${A} mt-[10px] flex items-center justify-between rounded-[14px] bg-card px-[14px] py-[10px]`} style={an("k-pop", 2600, 600)}>
          <span className="text-[14px] text-soft">Closed: you sent it by email at 9:12</span>
          <span className="rounded-full bg-card-hi px-[11px] py-[4px] text-[13px] font-medium text-ink">Undo</span>
        </div>

        <div className="mt-[18px] px-[4px] text-[15px] font-medium text-muted">This week</div>
        <Card className="mt-[8px] overflow-hidden">
          <TaskRow text={<>Send the final proposal for <b className="font-semibold">Karim</b></>} when="Sunday" said="said today, in a recording" />
          <Divider inset={52} />
          <TaskRow text={<>Book the review room for <b className="font-semibold">Omar</b></>} when="Thursday" said="said yesterday, in an email" />
        </Card>
        <div className="mt-[18px] px-[4px] text-[15px] font-medium text-muted">No date</div>
        <Card className="mt-[8px]">
          <TaskRow text={<>Ask about the Dubai move timeline for <b className="font-semibold">Sara Ali</b></>} said="when you see Sara Ali" />
        </Card>
      </div>
    </div>
  );
}

/** The Tasks list on its own: the first task checks itself off when an email shows it was done. */
export function TaskCloseCard({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="px-[4px] text-[14px] font-medium text-muted">Today</div>
      <Card>
        <TaskRow text={<>Send the new deck with the updated numbers for <b className="font-semibold">Sara Ali</b></>} when="Today" said="said Saturday, in a recording" closing={!still} />
      </Card>
      <div className={`${A} flex items-center justify-between rounded-[14px] bg-card px-[14px] py-[10px]`} style={an("k-pop", 2500, 600)}>
        <span className="text-[14px] text-soft">Closed: you sent it by email at 9:12</span>
        <span className="rounded-full bg-card-hi px-[11px] py-[4px] text-[13px] font-medium text-ink">Undo</span>
      </div>
      <div className="mt-[6px] px-[4px] text-[14px] font-medium text-muted">This week</div>
      <Card className="overflow-hidden">
        <TaskRow text={<>Send the final proposal for <b className="font-semibold">Karim</b></>} when="Sunday" said="said today, in a recording" />
      </Card>
    </div>
  );
}

function TaskRow({ text, when, said, closing = false }: { text: React.ReactNode; when?: string; said: string; closing?: boolean }) {
  return (
    <div className="flex items-start gap-[14px] px-[16px] py-[13px]">
      {closing ? (
        <span className="relative mt-[1px] h-[24px] w-[24px] shrink-0">
          <span className="absolute inset-0"><Check /></span>
          <span className="anim absolute inset-0" style={an("k-check-in", 1500, 500)}><Check done /></span>
        </span>
      ) : (
        <Check className="mt-[1px]" />
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`text-[16px] leading-[1.35] ${closing ? "anim line-through decoration-[1.5px]" : ""}`}
          style={closing ? an("k-done-text", 1800, 700) : undefined}
        >
          {text}
        </div>
        <div className="mt-[4px] flex items-center gap-[6px] text-[13.5px] text-faint">
          <Play size={7} />
          {said}
        </div>
      </div>
      {when && <span className="text-[13.5px] text-soft">{when}</span>}
    </div>
  );
}

/** Ask, and it does the work: an answer with its source, then a draft that waits for your tap. */
export function ChatScreen({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const seq = (steps: string) => (still ? undefined : { animation: steps });
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[58px] flex items-center justify-between">
        <NavCircle icon="back" />
        <span className="flex items-center gap-[8px] text-[17px] font-semibold text-ink">
          <KGlyph size={16} /> Krovvi
        </span>
        <NavCircle icon="more" />
      </div>

      <div className="absolute inset-x-[16px] top-[128px] flex flex-col gap-[14px]">
        <div className={`${A} self-end rounded-[20px] bg-card-hi px-[15px] py-[10px] text-[16px] text-ink`} style={an("k-pop", 200, 500)}>
          What did Karim say about the price?
        </div>

        <div className="relative min-h-[118px]">
          <span
            className="seq transient absolute left-[2px] top-[6px] flex gap-[5px]"
            style={seq("k-fade 200ms linear 700ms both, k-gone 200ms linear 1600ms forwards")}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="anim-loop h-[7px] w-[7px] rounded-full bg-soft" style={an("k-breathe", i * 180, 900)} />
            ))}
          </span>
          <div className={A} style={an("k-fade", 1700, 500)}>
            <div className="text-[16.5px] leading-[1.45] text-ink">
              He said 42,000, not the 46,000 in the quote. He also asked to pay half up front.
            </div>
            <span className="mt-[10px] inline-flex items-center gap-[7px] rounded-full bg-card px-[12px] py-[6px] text-[13px] text-soft">
              <Play size={7} className="text-ink" /> Call with Karim · 12:08
            </span>
          </div>
        </div>

        <div className={`${A} self-end rounded-[20px] bg-card-hi px-[15px] py-[10px] text-[16px] text-ink`} style={an("k-pop", 3000, 500)}>
          Write him a reply that confirms 42,000.
        </div>

        <div className="relative min-h-[250px]">
          <span
            className="seq transient absolute left-[2px] top-[2px] flex items-center gap-[8px] text-[14px] text-muted"
            style={seq("k-fade 200ms linear 3600ms both, k-gone 200ms linear 4500ms forwards")}
          >
            <KGlyph size={14} color="#8F8F8A" /> Writing to Karim
          </span>
          <div className={A} style={an("k-pop", 4600, 600)}>
            <Card className="px-[16px] py-[14px]">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-ink">Before it sends</span>
                <span className="text-faint">Valid for 30 minutes</span>
              </div>
              <div className="mt-[10px] grid grid-cols-[62px_1fr] gap-y-[4px] text-[14px]">
                <span className="text-faint">To</span>
                <span className="text-soft">Karim Nabil</span>
                <span className="text-faint">Subject</span>
                <span className="font-semibold text-ink">The quote</span>
              </div>
              <div className="mt-[10px] text-[14.5px] leading-[1.45] text-soft">
                Hi Karim, confirming 42,000 as we agreed on the call, with half up front. Thanks, Sam
              </div>
              <div className="relative mt-[14px] h-[36px]">
                <div
                  className="seq transient absolute inset-0 flex items-center gap-[14px]"
                  style={seq("k-gone 250ms var(--ease) 6500ms forwards")}
                >
                  <span
                    className="seq rounded-full bg-ink px-[18px] py-[8px] text-[14.5px] font-semibold text-ground"
                    style={seq("k-press 420ms var(--ease) 6000ms both")}
                  >
                    Send it
                  </span>
                  <span className="text-[14.5px] font-medium text-soft">Change it</span>
                </div>
                <div
                  className="seq absolute inset-0 flex items-center gap-[10px] text-[15px] font-semibold text-ink"
                  style={seq("k-pop 450ms var(--ease) 6700ms both")}
                >
                  <Check done /> Sent to Karim
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-[12px] bottom-[30px] flex h-[54px] items-center gap-[10px] rounded-[27px] bg-card px-[8px]">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-card-hi">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#EDEDEB" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 1.5v15M1.5 9h15" /></svg>
        </span>
        <span className="flex-1 text-[16px] text-faint">Ask, or give it a job</span>
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="#0A0A0A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 14V2M2 7l5-5 5 5" /></svg>
        </span>
      </div>
    </div>
  );
}

/** Home's meeting card, an hour before: what is open with the person you are about to see. */
export function MeetingCard({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <Card className="px-[18px] py-[16px]">
      <div className="flex items-center gap-[8px] text-[13px] font-medium text-muted">
        <span className={`${A}-loop h-[7px] w-[7px] rounded-full bg-ink`} style={an("k-breathe", 0, 1800)} />
        Up next · in 10 min
      </div>
      <div className="mt-[6px] text-[17px] font-semibold leading-[1.3] tracking-[-0.3px] text-ink">Atlas sync with Sara Ali</div>
      <div className={`${A} mt-[8px] text-[15px] leading-[1.45] text-soft`} style={an("k-rise", 700, 600)}>
        You owe Sara: the new deck with the updated numbers
      </div>
      <div className={`${A} mt-[4px] text-[14px] leading-[1.45] text-muted`} style={an("k-rise", 950, 600)}>
        Last time: the launch moved to October 15
      </div>
      <div className={`${A} mt-[14px] flex gap-[8px]`} style={an("k-fade", 1200)}>
        <span className="rounded-full bg-ink px-[16px] py-[7px] text-[14px] font-semibold text-ground">Record</span>
        <span className="rounded-full bg-card-hi px-[16px] py-[7px] text-[14px] font-medium text-ink">Brief</span>
      </div>
    </Card>
  );
}

/** A card from Home: someone still has the old version of a plan. */
export function OldDateCard({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  return (
    <Card className="px-[18px] py-[16px]">
      <div className="text-[13px] font-medium text-faint">Krovvi noticed</div>
      <div className="mt-[6px] text-[17px] font-semibold leading-[1.3] tracking-[-0.3px] text-ink">Mona still has the old date</div>
      <div className="mt-[6px] text-[15px] leading-[1.45] text-soft">
        You told Mona the launch was{" "}
        <span className="relative inline-block text-muted">
          October 3
          <span className={`${A} absolute left-0 right-0 top-1/2 h-[1.5px] origin-left bg-soft`} style={an("k-strike", 900, 600)} />
        </span>
        . It is now{" "}
        <span className={`${A} inline-block font-semibold text-ink`} style={an("k-pop", 1400, 500)}>October 15</span>.
      </div>
      <div className={`${A} mt-[14px] flex gap-[8px]`} style={an("k-fade", 1900)}>
        <span className="rounded-full bg-ink px-[16px] py-[7px] text-[14px] font-semibold text-ground">Tell Mona</span>
        <span className="rounded-full bg-card-hi px-[14px] py-[7px] text-[14px] font-medium text-ink">Not now</span>
      </div>
    </Card>
  );
}

/** A card from Home in the morning: a reply you owe, already written your way. */
export function DraftCard({ still = false }: { still?: boolean }) {
  const A = still ? "" : "anim";
  const words = "Hi Omar, the room is booked for Thursday at 10. I'll send the agenda tonight.".split(" ");
  return (
    <Card className="px-[18px] py-[16px]">
      <div className="text-[13px] font-medium text-faint">Errands</div>
      <div className="mt-[6px] text-[17px] font-semibold leading-[1.3] tracking-[-0.3px] text-ink">Reply to Omar about the review room</div>
      <div className="mt-[4px] text-[14px] text-muted">He asked yesterday. A draft is ready.</div>
      <div className="mt-[10px] rounded-[12px] bg-card-hi px-[13px] py-[11px] text-[14.5px] leading-[1.45] text-soft">
        {words.map((w, i) => (
          <span key={i} className={A} style={an("k-fade", 500 + i * 70, 250)}>
            {w}{" "}
          </span>
        ))}
      </div>
      <div className="mt-[14px] flex gap-[8px]">
        <span className="rounded-full bg-ink px-[18px] py-[7px] text-[14px] font-semibold text-ground">Send</span>
        <span className="rounded-full bg-card-hi px-[16px] py-[7px] text-[14px] font-medium text-ink">Edit</span>
      </div>
    </Card>
  );
}
