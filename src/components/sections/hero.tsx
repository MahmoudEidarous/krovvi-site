import { DotInitial, KGlyph } from "@/components/app/ui";
import { WeekScreen } from "@/components/app/week-screen";
import { KAlive } from "@/components/mark";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";
import { JOIN_URL } from "@/lib/site";

/** One thing Krovvi knows, about a person in your life or about you. It arrives as the answer reaches them. */
function MemoryCard({ who, sub, line, avatar, delay, nudge = 0 }: {
  who: string;
  sub: string;
  line: string;
  avatar: React.ReactNode;
  delay: number;
  nudge?: number;
}) {
  return (
    <div className="anim relative" style={{ ...an("k-slide-left", delay, 900), marginLeft: nudge }}>
      <div className="rounded-[20px] border border-white/[0.07] bg-[rgba(22,22,21,0.92)] p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{who}</div>
            <div className="text-[12.5px] text-faint">{sub}</div>
          </div>
        </div>
        <div className="mt-3 text-[13.5px] leading-[1.5] text-soft">{line}</div>
      </div>
      {/* The moment it is used: a dot on its edge lights once. */}
      <span
        className="anim absolute left-[-5px] top-[30px] h-[10px] w-[10px] rounded-full bg-ink shadow-[0_0_14px_rgba(237,237,235,0.7)]"
        style={an("k-blip", delay + 300, 1600)}
      />
    </div>
  );
}

const YOU = (
  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-card-hi">
    <KGlyph size={18} />
  </span>
);

export function Hero() {
  return (
    <section className="relative overflow-clip px-5 pb-6 pt-[104px] md:pt-[128px]">
      {/* The ground: a field of faint dots, the brand's material, fading out at the edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(237,237,235,0.10) 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          WebkitMaskImage: "radial-gradient(ellipse 75% 60% at 62% 40%, black 10%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 75% 60% at 62% 40%, black 10%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 xl:gap-12">
        {/* The words. */}
        <div className="text-center lg:pb-16 lg:text-left">
          <KAlive size={72} className="mx-auto mb-7 lg:mx-0 lg:-ml-[10px]" />
          <h1 className="text-balance text-[clamp(48px,7.4vw,92px)] font-semibold leading-[0.98] tracking-[-0.05em]">
            {["The", "AI", "that", "knows", "your", "life."].map((w, i) => (
              <span key={i} className="anim inline-block" style={an("k-rise-lg", 900 + i * 70, 1000)}>
                {w}
                {i < 5 ? " " : ""}
              </span>
            ))}
          </h1>
          <p
            className="anim mx-auto mt-7 max-w-[540px] text-pretty text-[clamp(18px,2.2vw,21px)] leading-[1.55] text-muted lg:mx-0"
            style={an("k-rise", 1400, 900)}
          >
            Krovvi remembers what people told you, keeps track of what you promised, and notices what changed. So when
            you need it, it&apos;s already caught up.
          </p>
          <div
            className="anim mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={an("k-rise", 1600, 900)}
          >
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

        {/* The proof: one personal question, answered by something that was there all week. */}
        <div className="relative mx-auto w-full">
          <div className="glow-warm left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2" />
          <div className="relative flex items-start justify-center gap-6">
            <div className="anim relative w-[min(318px,80vw)] shrink-0" style={an("k-rise-lg", 700, 1200)}>
              <Phone label="Asking Krovvi what is going on this week. It answers about Sara's deck, Karim's signed quote, dinner at mom's on Sunday and who picks up the kids, each with where it heard it.">
                <WeekScreen />
              </Phone>
            </div>

            {/* What Krovvi knows, arriving as the answer reaches each person. */}
            <div className="hidden w-[256px] shrink-0 flex-col gap-3 pt-[64px] xl:flex">
              <MemoryCard
                delay={1500}
                who="You"
                sub="What Krovvi knows about you"
                line="You run design at a small studio. You're training for a 10K in December. You like short answers."
                avatar={YOU}
              />
              <MemoryCard
                delay={2700}
                nudge={18}
                who="Sara Ali"
                sub="Atlas launch · talked Tuesday"
                line="Waiting on your new deck by Friday. Moving to Dubai in November."
                avatar={<DotInitial letter="S" size={38} ink="var(--sand)" />}
              />
              <MemoryCard
                delay={3550}
                who="Karim Nabil"
                sub="Client · talked Monday"
                line="Asked twice for the signed quote. You told him Monday."
                avatar={<DotInitial letter="K" size={38} ink="var(--clay)" />}
              />
              <MemoryCard
                delay={4400}
                nudge={18}
                who="Mom"
                sub="Family · talked Saturday"
                line="Dinner on Sunday at 7. You're bringing dessert."
                avatar={<DotInitial letter="M" size={38} ink="var(--bone)" />}
              />
            </div>
          </div>

          {/* Narrower screens: what it knows about you, under the screen. */}
          <div className="relative z-10 mx-auto -mt-16 w-[min(340px,88vw)] xl:hidden">
            <div className="anim rounded-[20px] border border-white/[0.07] bg-[rgba(22,22,21,0.95)] p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.55)]" style={an("k-rise", 2200, 900)}>
              <div className="flex items-center gap-3">
                {YOU}
                <div>
                  <div className="text-[15px] font-semibold text-ink">You</div>
                  <div className="text-[12.5px] text-faint">What Krovvi knows about you</div>
                </div>
              </div>
              <div className="mt-3 text-[13.5px] leading-[1.5] text-soft">
                You run design at a small studio. You&apos;re training for a 10K in December. You like short answers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
