"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { FIRST_CHAT_LABEL, FirstChatFilm } from "@/components/films/first-chat";
import { Phone } from "@/components/phone";
import { Tilt } from "@/components/tilt";
import { an } from "@/lib/anim";
import { JOIN_URL } from "@/lib/site";

/**
 * The first screen: what Krovvi is, and Krovvi saying it in its own words
 * beside it. The phone plays the app's real first chat with someone new:
 * two stock greetings typed and taken back, then "I'm not trying to be a
 * super intelligence. I'm trying to be a super friend." It pauses off
 * screen, in a background tab, or when asked to; with motion reduced it
 * shows the opening finished.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [away, setAway] = useState(false);
  const section = useRef<HTMLElement>(null);
  const paused = held || away;

  // Off screen or in a background tab, the film waits where it is.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let seen = true;
    const sync = () => setAway(!seen || document.visibilityState === "hidden");
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <section ref={section} className="relative overflow-clip px-5 pb-10 pt-[108px] md:pt-[128px]">
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-8">
        <div className="lg:pb-[64px]">
          <h1 className="text-[clamp(50px,6.3vw,92px)] font-semibold leading-[0.95] tracking-[-0.055em]">
            {["Your super", "friend."].map((row, r) => (
              <span key={r} className="block overflow-hidden pb-[0.06em]">
                <span className="anim inline-block" style={an("k-rise-lg", 200 + r * 150, 1100)}>
                  {row}
                </span>
              </span>
            ))}
          </h1>
          <div className="anim" style={an("k-rise", 650, 900)}>
            <p className="mt-8 max-w-[470px] text-pretty text-[clamp(18px,1.55vw,21px)] leading-[1.6] text-muted">
              Krovvi is the personal AI you actually want to spend time with. It knows your world, remembers what
              matters, makes life more fun, and gets things done.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={JOIN_URL}
                className="rounded-full bg-ink px-7 py-[14px] text-[16px] font-semibold text-ground no-underline transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                Join the beta
              </a>
              <a
                href="#how"
                className="rounded-full px-5 py-[14px] text-[16px] font-medium text-ink no-underline transition-colors hover:bg-card"
              >
                See how it works
              </a>
            </div>
            <div className="mt-4 text-[13.5px] text-faint">For iPhone. In beta now.</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[400px]">
          {/* Warm light behind the phone, and a soft pool of it under. */}
          <div className="glow-warm left-1/2 top-[44%] h-[980px] w-[980px] -translate-x-1/2 -translate-y-1/2" />
          <div
            className="pointer-events-none absolute bottom-[54px] left-1/2 h-[60px] w-[86%] -translate-x-1/2 rounded-[50%]"
            style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.65), transparent)" }}
          />
          <div className="anim relative" style={an("k-rise-lg", 350, 1300)}>
            <Tilt max={3} className="mx-auto w-[min(330px,80vw)] lg:w-[min(350px,calc((100svh_-_210px)*0.462))]">
              <Phone glint={1500} label={FIRST_CHAT_LABEL}>
                <div className={`absolute inset-0 ${paused ? "paused" : ""}`} data-onscreen={paused ? "0" : "1"}>
                  <FirstChatFilm playing={!paused} still={reduced} />
                </div>
              </Phone>
            </Tilt>
          </div>
          {/* One quiet control: the conversation keeps going until asked to wait. */}
          {!reduced && (
            <div className="anim mt-6 flex justify-center" style={an("k-fade", 1600, 800)}>
              <button
                type="button"
                onClick={() => setHeld((h) => !h)}
                aria-label={held ? "Play the conversation" : "Pause the conversation"}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-card text-soft transition-colors hover:bg-card-hi hover:text-ink"
              >
                {held ? (
                  <svg width="10" height="12" viewBox="0 0 12 14" aria-hidden="true">
                    <path d="M1 1.2v11.6c0 .6.7 1 1.2.7l9.3-5.8c.5-.3.5-1 0-1.4L2.2.5C1.7.2 1 .6 1 1.2Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="10" height="12" viewBox="0 0 12 14" aria-hidden="true">
                    <rect x="1" y="1" width="3.4" height="12" rx="1.2" fill="currentColor" />
                    <rect x="7.6" y="1" width="3.4" height="12" rx="1.2" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
