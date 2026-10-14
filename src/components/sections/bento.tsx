import { AsksVisual, FirstVisual, FunVisual, RemembersVisual } from "@/components/films/tiles";
import { InView } from "@/components/in-view";
import { an } from "@/lib/anim";

/**
 * What makes Krovvi a friend, in four parts, each shown as the app draws it,
 * large, on the app's own night: it remembers your world, it starts the
 * conversation, it makes the fun out of your life, and it asks when it isn't
 * sure. Each tile plays its moment when it comes into view.
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
            split
            className="lg:col-span-2"
            title="It remembers your world."
            body="Your people, your plans and the little things you mention. Each kept with where it came from, and yours to fix."
          >
            <RemembersVisual />
          </Tile>
          <Tile
            className="lg:row-span-2"
            title="It starts the conversation."
            body="No empty box. When something matters, it writes first, and it stays quiet the rest of the time."
          >
            <FirstVisual />
          </Tile>
          <Tile align="center" title="Fun, made from your life." body="Games it makes from what it knows about you.">
            <FunVisual />
          </Tile>
          <Tile align="center" title="It asks, so it gets you right." body="When it isn't sure, it asks. And you can fix anything it remembers.">
            <AsksVisual />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ title, body, children, className, align = "end", split = false }: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
  /** Wide screens: the words on the left and the picture on the right, both in the middle of the tile. */
  split?: boolean;
  /** Where the picture sits in the space under the words. */
  align?: "start" | "center" | "end";
}) {
  const place = align === "start" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";
  return (
    <InView
      className={`group relative flex flex-col overflow-hidden rounded-[30px] border border-white/[0.07] p-6 transition-[transform,border-color] duration-500 [transition-timing-function:var(--ease)] hover:-translate-y-1 hover:border-white/[0.11] md:p-8 ${className ?? ""}`}
      style={{ background: "#040404" }}
    >
      {/* The app's night, plain as its pages are (no stars behind words), with a soft light from above. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(110% 55% at 50% -12%, rgba(237,237,235,0.075) 0%, rgba(237,237,235,0) 62%)" }}
      />
      <div className={split ? "relative flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10" : "contents"}>
        <div className={split ? "relative" : "contents"}>
          <h3
            className="anim relative max-w-[520px] text-balance text-[clamp(23px,2.3vw,30px)] font-semibold leading-[1.12] tracking-[-0.03em]"
            style={an("k-rise", 0, 800)}
          >
            {title}
          </h3>
          <p className="anim relative mt-3 max-w-[480px] text-pretty text-[16px] leading-[1.6] text-muted" style={an("k-rise", 100, 800)}>
            {body}
          </p>
        </div>
        <div className={`relative mt-8 flex flex-1 flex-col ${split ? "lg:mt-0 lg:justify-center" : place}`}>{children}</div>
      </div>
    </InView>
  );
}
