import {
  ChangedVisual,
  OwesVisual,
  PeopleVisual,
  ReadOnYouVisual,
  RememberVisual,
  SpeakUpVisual,
} from "@/components/app/bento-visuals";
import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/**
 * What having Krovvi means, in six parts: it remembers, it knows who matters,
 * it understands you, it keeps up, it speaks up at the right time, and it
 * knows who owes what. Each tile plays its own small film.
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
            It remembers. It understands. It keeps up.
          </h2>
          <p
            className="anim mx-auto mt-6 max-w-[620px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted"
            style={an("k-rise", 150, 900)}
          >
            Krovvi learns from your real conversations and everything you share with it. So it knows things a chat box
            never could.
          </p>
        </InView>

        <div className="mt-14 grid gap-4 md:mt-20 lg:grid-cols-3 lg:gap-5">
          <Tile
            className="lg:col-span-2"
            title="It remembers exactly what was said."
            body="Prices, promises, plans and dates, each with the moment it was said. Tap a line and hear it again."
          >
            <RememberVisual />
          </Tile>
          <Tile
            align="start"
            bleed
            className="lg:row-span-2"
            title="It knows the people in your life."
            body="Who you talk with most, what you owe each other, and where things stand before you meet."
          >
            <PeopleVisual />
          </Tile>
          <Tile
            title="It understands what you're working toward."
            body="Your goals, what you're still deciding, and how you like things done. See all of it, and fix any of it."
          >
            <ReadOnYouVisual />
          </Tile>
          <Tile
            align="center"
            title="It keeps up when plans change."
            body="A date moves, a price changes. Krovvi updates what it knows, and tells you who still has the old version."
          >
            <ChangedVisual />
          </Tile>
          <Tile
            align="center"
            title="It speaks up at the right moment."
            body="A heads-up before you meet, a nudge when something's due. Quiet the rest of the time."
          >
            <SpeakUpVisual />
          </Tile>
          <Tile
            align="center"
            className="lg:col-span-2"
            title="It knows who owes what."
            body="Money, favors and promises between you and everyone, straight from your conversations. Just ask."
          >
            <OwesVisual />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ title, body, children, className, align = "end", bleed = false }: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
  /** Where the picture sits in the space under the words. */
  align?: "start" | "center" | "end";
  /** The picture runs off the foot of the tile, fading into it (a phone cut by the edge). */
  bleed?: boolean;
}) {
  const place = align === "start" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";
  return (
    <InView
      className={`group relative flex flex-col overflow-hidden rounded-[30px] border border-white/[0.06] p-6 transition-[transform,border-color] duration-500 [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:border-white/[0.1] md:p-8 ${bleed ? "pb-0 md:pb-0" : ""} ${className ?? ""}`}
      style={{ background: "radial-gradient(130% 90% at 50% 0%, #1c1c1b 0%, #131312 52%, #0f0f0e 100%)" }}
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(237,237,235,0.07),transparent_70%)] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
      <h3
        className="anim relative max-w-[520px] text-balance text-[clamp(23px,2.3vw,30px)] font-semibold leading-[1.12] tracking-[-0.03em]"
        style={an("k-rise", 0, 800)}
      >
        {title}
      </h3>
      <p className="anim relative mt-3 max-w-[480px] text-pretty text-[16px] leading-[1.6] text-muted" style={an("k-rise", 100, 800)}>
        {body}
      </p>
      {bleed ? (
        // The phone is placed, not flowed, so it never stretches the row; the tile cuts it.
        <div className="relative mt-8 min-h-[520px] flex-1 lg:min-h-0">
          <div className="absolute inset-x-0 top-0">{children}</div>
        </div>
      ) : (
        <div className={`relative mt-8 flex flex-1 flex-col ${place}`}>{children}</div>
      )}
      {bleed && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px]"
          style={{ background: "linear-gradient(to bottom, rgba(15,15,14,0), #0f0f0e 92%)" }}
        />
      )}
    </InView>
  );
}
