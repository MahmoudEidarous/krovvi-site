import { LockScreen } from "@/components/app/more-screens";
import { Card, Check, DotInitial, Play } from "@/components/app/ui";
import { KAlive } from "@/components/mark";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";
import { JOIN_URL } from "@/lib/site";

const HEADLINE = ["Know", "where", "things", "stand", "with", "everyone."];

export function Hero() {
  return (
    <section className="relative overflow-clip px-5 pb-10 pt-[112px] text-center md:pt-[132px]">
      {/* The ground: a field of faint dots, the brand's material, fading out at the edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(237,237,235,0.11) 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 38%, black 10%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 38%, black 10%, transparent 75%)",
        }}
      />
      <div className="glow left-1/2 top-[-280px] h-[1100px] w-[1100px] -translate-x-1/2" />

      <div className="relative mx-auto flex max-w-[980px] flex-col items-center">
        <KAlive size={104} className="mb-6 md:mb-8" />
        <h1 className="text-balance text-[clamp(44px,8.2vw,96px)] font-semibold leading-[1.02] tracking-[-0.045em]">
          {HEADLINE.map((w, i) => (
            <span key={i} className="anim inline-block" style={an("k-rise-lg", 900 + i * 70, 1000)}>
              {w}
              {i < HEADLINE.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p
          className="anim mx-auto mt-6 max-w-[620px] text-pretty text-[clamp(17px,2.3vw,21px)] leading-[1.55] text-muted"
          style={an("k-rise", 1450, 900)}
        >
          Krovvi is an iPhone app for the conversations in your life. It keeps track of what people promised, what was
          decided and what changed, so you don&apos;t have to keep it all in your head.
        </p>
        <div className="anim mt-9 flex flex-col items-center gap-3 sm:flex-row" style={an("k-rise", 1650, 900)}>
          <a
            href={JOIN_URL}
            className="rounded-full bg-ink px-7 py-[14px] text-[16px] font-semibold text-ground no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            Join the beta
          </a>
          <a
            href="#how"
            className="flex items-center gap-2 rounded-full px-6 py-[14px] text-[16px] font-medium text-ink no-underline transition-colors hover:bg-card"
          >
            See how it works
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 1.5v9M2 6.5l4 4 4-4" />
            </svg>
          </a>
        </div>
        <div className="anim mt-4 text-[13.5px] text-faint" style={an("k-fade", 1900, 900)}>
          For iPhone. In beta now.
        </div>
      </div>

      {/* The moment itself: Krovvi speaks up just before you meet someone. */}
      <div className="relative mx-auto mt-14 flex max-w-[1180px] justify-center md:mt-20">
        <div className="glow-warm left-1/2 top-[8%] h-[760px] w-[760px] -translate-x-1/2" />
        <div className="anim relative w-[min(330px,78vw)]" style={an("k-rise-lg", 1800, 1200)}>
          <Phone label="Krovvi on the lock screen: Seeing Sara at 6:17 PM. You owe: the new deck with the updated numbers.">
            <LockScreen delay={2900} />
          </Phone>
        </div>

        {/* Around it, two things that made the moment possible. */}
        <div className="pointer-events-none absolute left-0 top-[16%] hidden w-[300px] text-left lg:block xl:left-[2%]">
          <div className="anim" style={an("k-slide-left", 3400, 900)}>
            <div className="float" style={{ "--dur": "8s" } as React.CSSProperties}>
              <Card className="border border-line px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="text-[12.5px] font-semibold text-muted">What I caught · Atlas design review</div>
                {[
                  ["Task", "You: Send the new deck", "3:12"],
                  ["Decision", "The launch moves to October 15", "7:40"],
                  ["Money", "The budget stays at 40,000", "9:05"],
                ].map(([k, t, at]) => (
                  <div key={k} className="mt-[10px] flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[10.5px] font-semibold text-faint">{k}</div>
                      <div className="text-[13.5px] text-soft">{t}</div>
                    </div>
                    <span className="flex items-center gap-1 text-[11.5px] text-faint tabular">
                      <Play size={6} /> {at}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-[44%] hidden w-[290px] text-left lg:block xl:right-[2%]">
          <div className="anim" style={an("k-rise", 3900, 900)}>
            <div className="float" style={{ "--dur": "9s", "--delay": "1.2s" } as React.CSSProperties}>
              <Card className="border border-line px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-3">
                  <DotInitial letter="S" size={36} ink="var(--sand)" />
                  <div>
                    <div className="text-[14px] font-semibold text-ink">Sara confirmed it</div>
                    <div className="text-[12.5px] text-faint">What you agreed · Saturday</div>
                  </div>
                  <span className="ml-auto"><Check done /></span>
                </div>
                <div className="mt-3 text-[13.5px] leading-[1.45] text-soft">The Atlas launch moves to October 15. Sara sends the final copy by Sunday.</div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
