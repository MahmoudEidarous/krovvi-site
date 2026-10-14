import { FunVisual, OrderVisual, PeopleVisual } from "@/components/films/tiles";
import { CloseVisual, SendVisual, TextsFirstVisual } from "@/components/films/tiles-wait";
import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/**
 * What Krovvi is, in six parts, each shown as the moment it happens in
 * today's app: it is fun to talk to, it knows your people (and asks when it
 * isn't sure), it texts you first, you can send it anything, it is on your
 * Home Screen, and it keeps your life in order. Each tile plays its own small
 * film when it comes into view.
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
            className="lg:col-span-2"
            title="It's fun to talk to."
            body="Funny, honest and curious, with opinions of its own. Bored? It has a game for that."
          >
            <FunVisual />
          </Tile>
          <Tile
            align="start"
            bleed
            className="lg:row-span-2"
            title="It knows your people."
            body="Who they are to you, and what's going on with them. When it isn't sure, it asks."
          >
            <PeopleVisual />
          </Tile>
          <Tile
            title="It texts you first."
            body="When something matters, it writes first. Quiet the rest of the time."
          >
            <TextsFirstVisual />
          </Tile>
          <Tile
            align="center"
            title="Send it anything."
            body="Voice notes, photos, links and files. It reads every one, and keeps what matters."
          >
            <SendVisual />
          </Tile>
          <Tile
            align="center"
            title="It's on your Home Screen."
            body="Its latest message, right where you'll see it. One tap, and you're talking."
          >
            <CloseVisual />
          </Tile>
          <Tile
            align="center"
            className="lg:col-span-2"
            title="It keeps your life in order."
            body="Money, plans and trips, kept as you talk. Answers come as real screens, and it asks before anything goes out."
          >
            <OrderVisual />
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
