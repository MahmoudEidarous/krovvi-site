import { PeopleMapVisual } from "@/components/films/people-map";
import { AdaptsVisual, AppsVisual, AsksVisual, FirstVisual, FunVisual } from "@/components/films/tiles";
import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/**
 * What makes Krovvi a friend, each shown as the app draws it, large, on the
 * app's own night. The star is its memory of your world: the People map,
 * where the more you talk, the closer someone sits, and a change is kept up
 * with. Then what a friend does (it starts the conversation, makes the fun
 * out of your life, asks when it isn't sure, adapts to how you like things),
 * and last the apps it fills in as you talk.
 */
export function Bento() {
  return (
    <section className="relative px-5 pt-[120px] md:pt-[180px]">
      <div className="mx-auto max-w-[1200px]">
        <InView className="mx-auto max-w-[860px] text-center">
          <h2
            className="anim text-balance text-[clamp(38px,6vw,72px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            One friend. Your whole world.
          </h2>
          <p
            className="anim mx-auto mt-6 max-w-[620px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted"
            style={an("k-rise", 150, 900)}
          >
            It&apos;s the friend who remembers what matters to you, and can actually help.
          </p>
        </InView>

        <div className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-3 lg:gap-5">
          <Tile
            star
            className="lg:col-span-3"
            title="It remembers your world."
            body="Your people, your plans and the little things you mention, each kept with where it came from. When something changes, it keeps up. And the more you talk, the closer they sit."
          >
            <div className="mx-auto w-full max-w-[520px]">
              <PeopleMapVisual label="The People map in Krovvi: you in the middle, your family on the first ring, then the people you talk with most, then everyone else, with family at the top, work at the bottom left and friends at the bottom right. Omar, who you talked with every day this week, moves one ring closer, and his card shows dinner moved from Friday to Saturday, from his message: Saturday instead? Same place. Then Lina, your sister, who moved to Lisbon in March; Mona, vegetarian now; and Sam, who owes you the contract by Monday." />
            </div>
          </Tile>

          <Tile className="lg:row-span-2" title="It starts the conversation." body="No empty box. When something matters, it writes first, and it stays quiet the rest of the time.">
            <FirstVisual />
          </Tile>
          <Tile split className="lg:col-span-2" title="Fun, made from your life." body="Games it makes from what it knows about you. You play, and it learns you a little better.">
            <FunVisual />
          </Tile>
          <Tile split className="lg:col-span-2" title="It asks, so it gets you right." body="When it isn't sure, it asks, a few quick ones at a time. And you can fix anything it remembers.">
            <AsksVisual />
          </Tile>

          <Tile title="It adapts to you." body="It learns how you talk and what you like. No settings to fill in.">
            <AdaptsVisual />
          </Tile>
          <Tile
            split
            className="lg:col-span-2"
            title="Your life, in order."
            body="Money, plans, trips, workouts and more. Its apps fill themselves as you talk, so you never fill in a form."
          >
            <div className="mx-auto w-full max-w-[460px]">
              <AppsVisual />
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ title, body, children, className, split = false, star = false, reverse = false }: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
  /** Wide screens: the words on one side and the picture on the other, both in the middle of the tile. */
  split?: boolean;
  /** The star of the bento: split as well, with the larger words. */
  star?: boolean;
  /** Split with the picture first. */
  reverse?: boolean;
}) {
  const sideways = split || star;
  return (
    <InView
      className={`group relative flex flex-col overflow-hidden rounded-[30px] border border-white/[0.07] p-6 transition-[transform,border-color] duration-500 [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:border-white/[0.11] md:p-8 ${star ? "lg:p-12" : ""} ${className ?? ""}`}
      style={{ background: "#040404" }}
    >
      {/* The app's night, plain as its pages are (no stars behind words), with a soft light from above. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: star ? "radial-gradient(70% 70% at 72% 45%, rgba(237,237,235,0.06) 0%, rgba(237,237,235,0) 65%)" : "radial-gradient(110% 55% at 50% -12%, rgba(237,237,235,0.075) 0%, rgba(237,237,235,0) 62%)" }}
      />
      <div
        className={
          sideways
            ? `relative flex flex-1 flex-col lg:grid lg:items-center lg:gap-12 ${star ? "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"}`
            : "relative flex flex-1 flex-col"
        }
      >
        <div className={`relative ${reverse ? "lg:order-2" : ""}`}>
          <h3
            className={`anim relative max-w-[520px] text-balance font-semibold tracking-[-0.03em] ${star ? "text-[clamp(30px,3.6vw,50px)] leading-[1.04] tracking-[-0.045em]" : "text-[clamp(23px,2.3vw,30px)] leading-[1.12]"}`}
            style={an("k-rise", 0, 800)}
          >
            {title}
          </h3>
          <p
            className={`anim relative mt-3 max-w-[480px] text-pretty leading-[1.6] text-muted ${star ? "mt-5 text-[clamp(17px,1.5vw,19px)]" : "text-[16px]"}`}
            style={an("k-rise", 100, 800)}
          >
            {body}
          </p>
        </div>
        <div className={`relative mt-8 flex flex-1 flex-col justify-end ${sideways ? "lg:mt-0 lg:justify-center" : ""} ${reverse ? "lg:order-1" : ""}`}>{children}</div>
      </div>
    </InView>
  );
}
