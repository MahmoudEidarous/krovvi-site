import { DraftCard, MeetingCard, Notification, OldDateCard, TaskCloseCard } from "@/components/app/more-screens";
import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/** The moments Krovvi speaks up on its own, each a small film that starts when it is seen. */
export function Moments() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <div className="mx-auto max-w-[1120px]">
        <InView className="max-w-[720px]">
          <h2 className="anim text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]" style={an("k-rise-lg", 0, 1000)}>
            It notices, so you don&apos;t have to.
          </h2>
          <p className="anim mt-5 max-w-[560px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            Krovvi speaks up when something needs you, and stays quiet when nothing does.
          </p>
        </InView>

        <div className="mt-14 grid gap-4 md:grid-cols-2 md:gap-5">
          <Tile
            title="Right before you meet"
            body="Share your calendar, and Krovvi shows what is still open between you, with a heads-up ten minutes before."
          >
            <div className="flex flex-col gap-3">
              <div className="anim" style={an("k-drop", 1700, 800)}>
                <Notification
                  title="Seeing Sara at 6:17 PM"
                  body="You owe: the new deck with the updated numbers."
                />
              </div>
              <div className="anim" style={an("k-rise", 300, 800)}>
                <MeetingCard />
              </div>
            </div>
          </Tile>

          <Tile
            title="Tasks that close themselves"
            body="When a later conversation or email shows a task is done, Krovvi checks it off and shows where it saw that."
          >
            <TaskCloseCard />
          </Tile>

          <Tile
            title="Who still has the old date"
            body="When a plan changes, Krovvi tells you who heard the old version, before it turns into a problem."
          >
            <OldDateCard />
          </Tile>

          <Tile
            title="The reply you owe, already written"
            body="Connect Gmail, and each morning Krovvi drafts the replies you owe, the way you write to that person. You read it, then send it or change it."
          >
            <DraftCard />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <InView className="group relative flex flex-col overflow-hidden rounded-[28px] bg-card px-6 pb-6 pt-7 transition-transform duration-500 [transition-timing-function:var(--ease)] hover:-translate-y-1 md:px-8 md:pb-8 md:pt-8">
      <h3 className="text-[23px] font-semibold tracking-[-0.025em]">{title}</h3>
      <p className="mt-2 max-w-[440px] text-[16px] leading-[1.55] text-muted">{body}</p>
      <div className="mt-7 flex flex-1 items-end">
        <div className="w-full rounded-[22px] bg-ground p-3 md:p-4">{children}</div>
      </div>
    </InView>
  );
}
