import { Drift, ParallaxY, Reveal, Rise } from "@/components/fx";
import { FeatureRow } from "@/components/feature-row";
import { Phone } from "@/components/phone";
import { SiteFooter } from "@/components/site-footer";
import { Wave } from "@/components/wave";

export default function Home() {
  return (
    <main>
      <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[clamp(24px,5vw,56px)] py-7">
        <a href="/" className="text-[17px] font-semibold tracking-[-0.01em]">
          krovvi
        </a>
        <a href="/support" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
          Support
        </a>
      </nav>

      <section className="relative flex flex-col items-center px-6 pt-[150px] text-center">
        <div className="glow left-1/2 top-[38%] h-[1400px] w-[1400px] -translate-x-1/2" />
        <Rise>
          <h1 className="text-[clamp(48px,8.6vw,88px)] font-semibold leading-[1.03] tracking-[-0.035em]">
            Never lose
            <br />
            a thought.
          </h1>
        </Rise>
        <Rise delay={0.1}>
          <p className="mx-auto mt-6 max-w-[480px] text-[clamp(17px,2.6vw,22px)] leading-[1.55] text-[var(--muted)]">
            Talk. Krovvi writes it down. Notes, tasks, and a memory of your world, made from your
            words.
          </p>
        </Rise>
        <Rise delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-3.5">
            <div className="rounded-full bg-[var(--fg)] px-[30px] py-[15px] text-base font-semibold tracking-[-0.01em] text-[var(--bg)]">
              Coming to the App Store
            </div>
            <div className="text-sm text-[var(--faint)]">
              Want in early?{" "}
              <a href="mailto:support@krovvi.com" className="text-[var(--muted)] underline">
                support@krovvi.com
              </a>
            </div>
          </div>
        </Rise>
        <Rise delay={0.34}>
          <Wave className="mt-[72px]" />
        </Rise>
        <Rise delay={0.42} className="relative mt-[84px] pb-[130px]">
          <ParallaxY amount={50}>
            <Drift>
              <div className="w-[min(430px,82vw)]">
                <Phone
                  shot="/shots/home.png"
                  alt="The Krovvi library: voice notes, documents, and meetings, each already written down"
                  priority
                />
              </div>
            </Drift>
          </ParallaxY>
        </Rise>
      </section>

      <div className="mx-auto max-w-[1100px] px-6">
        <div className="flex flex-col gap-[140px] pb-10 pt-[60px] md:gap-[190px]">
          <FeatureRow
            kicker="Capture"
            title="Notes that write themselves."
            body="Press one button and say what's on your mind. A finished note comes back: the summary, the decisions, and the to-dos already pulled out. You never replay a recording."
            shot="/shots/note.png"
            alt="A finished note with summary, decisions, and tasks"
          />
          <FeatureRow
            flip
            kicker="Assistant"
            title="Say it. It's handled."
            body="Krovvi does real work from your words. It sets reminders, drafts emails you approve before they send, runs your calendar, and writes the plan. Every answer links to the moment you said it."
            shot="/shots/agent.png"
            alt="The Krovvi assistant wrapping up a day: reminders set, an email drafted for approval"
          />
          <FeatureRow
            kicker="Library"
            title="Bring everything in."
            body="Voice notes, hour-long meetings, PDFs, and documents all land in one library. Share anything into Krovvi and it gets read, summarized, and remembered."
            shot="/shots/import.png"
            alt="The library reading a PDF, holding a meeting and voice notes"
          />
          <FeatureRow
            flip
            kicker="Memory"
            title="It remembers your world."
            body="Your days, told back. Who came up, what you learned, what was decided. Ask about anything you ever said and hear the answer in your own voice."
            shot="/shots/days.png"
            alt="The Days journal: people, learned facts, and recordings day by day"
          />
        </div>
      </div>

      <section className="relative px-6 pb-10 pt-[190px] text-center">
        <div className="glow left-1/2 top-[-10%] h-[1400px] w-[1400px] -translate-x-1/2" />
        <Reveal>
          <h2 className="text-[clamp(36px,5.4vw,58px)] font-semibold tracking-[-0.03em]">
            Your world, in your words.
          </h2>
          <p className="mt-4 text-[clamp(16px,2.2vw,19px)] text-[var(--muted)]">
            Krovvi is in beta and coming to the App Store.
          </p>
          <a
            href="mailto:support@krovvi.com"
            className="mt-8 inline-block rounded-full bg-[var(--fg)] px-[30px] py-[15px] text-base font-semibold tracking-[-0.01em] text-[var(--bg)] no-underline"
          >
            Get in touch
          </a>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
