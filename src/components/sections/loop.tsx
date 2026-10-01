import { KnowsScreen } from "@/components/app/loop-screen";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";

/**
 * What using it more gets you, shown rather than told: the same big
 * question asked on day one and six months in. One answer could be for
 * anyone; the other weighs your kids, your lease, your money and your own
 * words, each with where it heard them.
 */
export function Loop() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[860px] text-center">
          <h2
            className="anim text-balance text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em]"
            style={an("k-rise-lg", 0, 1000)}
          >
            The more you use it, the more it knows you.
          </h2>
          <p
            className="anim mx-auto mt-6 max-w-[560px] text-pretty text-[clamp(17px,2vw,20px)] leading-[1.6] text-muted"
            style={an("k-rise", 150, 900)}
          >
            On day one, it answers like any AI. A few months in, it answers like someone who was there.
          </p>
        </div>

        <div className="relative mt-16 grid items-start justify-items-center gap-20 md:mt-20 md:grid-cols-2 md:gap-10 lg:gap-20">
          <figure className="anim w-[min(290px,74vw)] md:mt-10" style={an("k-rise", 300, 900)}>
            <figcaption className="mb-7 text-center">
              <div className="text-[clamp(22px,2.2vw,28px)] font-semibold tracking-[-0.03em] text-faint">Day 1</div>
              <div className="mt-1 text-[15px] text-faint">It doesn&apos;t know your life yet.</div>
            </figcaption>
            <div className="opacity-[0.78] saturate-[0.6]">
              <Phone label={`Day one. You ask: "Should I take the job in Dubai?" Krovvi lists the usual things to weigh and asks what's making you think about it.`}>
                <KnowsScreen known={false} />
              </Phone>
            </div>
          </figure>

          <figure className="anim relative w-[min(330px,80vw)]" style={an("k-rise", 450, 900)}>
            <div className="glow-warm left-1/2 top-[55%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2" />
            <figcaption className="relative mb-7 text-center">
              <div className="text-[clamp(22px,2.2vw,28px)] font-semibold tracking-[-0.03em] text-ink">Month 6</div>
              <div className="mt-1 text-[15px] text-muted">It knows what&apos;s at stake.</div>
            </figcaption>
            <div className="relative">
              <Phone label={`Six months in. Same question. Krovvi weighs what the move would touch: your Wednesdays with the kids, the lease's 60 days' notice, the 21,000 you still owe Karim, and the lead role you told Omar you wanted. Each with where it heard it.`}>
                <KnowsScreen known />
              </Phone>
            </div>
          </figure>
        </div>
      </InView>
    </section>
  );
}
