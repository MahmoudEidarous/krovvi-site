import { ChatScreen } from "@/components/app/more-screens";
import { InView } from "@/components/in-view";
import { Phone } from "@/components/phone";
import { an } from "@/lib/anim";

const POINTS = [
  ["Answers with their source", "Every answer links to the moment or the email it came from."],
  ["Drafts in your words", "Krovvi writes the email or adds the meeting for you."],
  ["Nothing goes out on its own", "A draft waits for your tap. Change it, send it, or let it go."],
];

export function Ask() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <div className="mx-auto grid max-w-[1120px] items-center gap-14 md:grid-cols-[1fr_minmax(0,420px)] md:gap-20">
        <InView>
          <h2 className="anim text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]" style={an("k-rise-lg", 0, 1000)}>
            Ask anything. See where the answer came from.
          </h2>
          <p className="anim mt-5 max-w-[520px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted" style={an("k-rise", 150, 900)}>
            Ask about anything you recorded or sent to Krovvi. Then ask it to do the next step.
          </p>
          <div className="mt-10 flex max-w-[480px] flex-col gap-6">
            {POINTS.map(([t, b], i) => (
              <div key={t} className="anim flex gap-4" style={an("k-rise", 300 + i * 120, 800)}>
                <span className="mt-[9px] h-[7px] w-[7px] shrink-0 rounded-full bg-ink" />
                <div>
                  <div className="text-[18px] font-semibold tracking-[-0.015em]">{t}</div>
                  <div className="mt-1 text-[16px] leading-[1.55] text-muted">{b}</div>
                </div>
              </div>
            ))}
          </div>
        </InView>
        <InView className="relative mx-auto w-[min(340px,80vw)]">
          <div className="glow-warm left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2" />
          <Phone label="Asking Krovvi what Karim said about the price, then confirming a reply before it sends.">
            <ChatScreen />
          </Phone>
        </InView>
      </div>
    </section>
  );
}
