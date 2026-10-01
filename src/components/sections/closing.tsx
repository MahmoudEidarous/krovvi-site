import { InView } from "@/components/in-view";
import { KAlive } from "@/components/mark";
import { an } from "@/lib/anim";
import { JOIN_URL } from "@/lib/site";

export function Closing() {
  return (
    <section id="join" className="relative px-5 pb-10 pt-[160px] text-center md:pt-[240px]">
      <div className="glow left-1/2 top-[40px] h-[720px] w-[720px] -translate-x-1/2" />
      <InView className="relative mx-auto flex max-w-[900px] flex-col items-center">
        <KAlive size={132} />
        <h2 style={an("k-rise-lg", 1400, 1000)} className="anim mt-10 text-balance text-[clamp(40px,6.6vw,80px)] font-semibold leading-[1.02] tracking-[-0.045em]">
          Krovvi keeps up, so you don&apos;t have to.
        </h2>
        <p style={an("k-rise", 1600, 900)} className="anim mt-5 max-w-[520px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted">
          Krovvi is in beta on iPhone. Join, record your next real conversation, and see what it catches.
        </p>
        <a
          href={JOIN_URL}
          style={an("k-rise", 1800, 900)}
          className="anim mt-9 rounded-full bg-ink px-8 py-[15px] text-[16px] font-semibold text-ground no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
        >
          Join the beta
        </a>
      </InView>
    </section>
  );
}
