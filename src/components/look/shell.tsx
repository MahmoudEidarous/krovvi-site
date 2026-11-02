import { Nunito } from "next/font/google";

import { JOIN_URL, SUPPORT_EMAIL } from "@/lib/site";

import { KTile, Wordmark, WORD_BOTTOM, WORD_TOP, wordLetters } from "./brand";
import { LookMotion } from "./motion-client";

/** The bubbly heavy face for what the page says big (the app's look), served from this site, never fetched from Google. */
const nunito = Nunito({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-nunito", display: "swap" });

/**
 * Before the first paint: scripts are on, and the colour picked last time is set. The page is always light (its night
 * parts are night by design), so a phone's dark mode changes nothing. ?fresh forgets what you told the first phone. If
 * the page's script has not started four seconds later, everything it would have brought in is shown as it is.
 */
const BEFORE_PAINT = `(function(){var d=document.documentElement,t='purple';d.classList.add('js');try{var q=new URLSearchParams(location.search),s=q.get('theme')||localStorage.getItem('kl-theme');if(/^(purple|ocean|coral|mono)$/.test(s))t=s;if(q.has('fresh'))localStorage.removeItem('kl-you')}catch(e){}d.setAttribute('data-theme',t);setTimeout(function(){if(!window.__kl)d.classList.remove('js')},4000)})();`;

/** Every page in the new look: the colour, the ground, the top bar, the page, the foot, and the script that moves them. */
export function LookShell({ home, children }: { home: boolean; children: React.ReactNode }) {
  return (
    <div className={`kl ${nunito.variable}`} data-home={home ? "1" : "0"}>
      <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
      <div className="ground" aria-hidden="true" />
      <TopBar home={home} />
      {children}
      <Foot home={home} />
      <LookMotion />
    </div>
  );
}

const ARROW = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
  </svg>
);

/** The way in: the same link the site has always used (lib/site.ts), until there is a store link. */
export function GetKrovvi() {
  return (
    <a className="getbig" href={JOIN_URL}>
      Get Krovvi{ARROW}
    </a>
  );
}

/** The top bar: one floating glass capsule. It turns dark over the night parts of the page. */
function TopBar({ home }: { home: boolean }) {
  const at = home ? "" : "/";
  return (
    <header className="cap" id="cap">
      <a className="cap-brand" href={home ? "#top" : "/"} aria-label={home ? "Krovvi, back to the top" : "Krovvi, home"}>
        <KTile size={32} />
        <Wordmark className="wordmark" />
      </a>
      <nav className="cap-links" id="capLinks" aria-label={home ? "On this page" : "Krovvi"}>
        <i className="cap-hl" aria-hidden="true" />
        <a href={`${at}#friend`} data-go="friend">
          Why a friend
        </a>
        <a href={`${at}#tasks`} data-go="tasks">
          How it helps
        </a>
        <a href="/support">Support</a>
      </nav>
      <a className="cap-get" href={JOIN_URL}>
        Get Krovvi
      </a>
    </header>
  );
}

const DOTS: { pick: string; label: string; a?: string; b?: string }[] = [
  { pick: "purple", label: "Purple", a: "#7B6BFF", b: "#5B49F2" },
  { pick: "ocean", label: "Ocean", a: "#3A8DFF", b: "#1A5FE0" },
  { pick: "coral", label: "Coral", a: "#EF6B39", b: "#D9481A" },
  { pick: "mono", label: "Mono" },
];

/**
 * The foot: the same night as the stage above it, no box around it. The links, your colour, the name as big as the page
 * in Krovvi's own strokes (its letters lean up toward your pointer, or jump when you tap them), and at the very bottom
 * the line a phone has for going home, which takes you back to the top.
 */
function Foot({ home }: { home: boolean }) {
  const at = home ? "" : "/";
  const letters = wordLetters();
  const PAD = 3;
  const left = letters[0].left - PAD;
  const width = letters[letters.length - 1].right + PAD - left;
  const height = WORD_BOTTOM - WORD_TOP;
  return (
    <footer className="ft" id="ft" data-mode="dark">
      <div className="ft-top">
        <div className="ft-brand">
          <a className="ft-logo" href={home ? "#top" : "/"} aria-label={home ? "Krovvi, back to the top" : "Krovvi, home"}>
            <KTile size={38} />
            <Wordmark className="wordmark" />
          </a>
          <p>Your super friend, on iPhone. An AI that gets things done, and is there when you need to talk.</p>
        </div>
        <nav className="ft-col" aria-label="Krovvi">
          <b>Krovvi</b>
          <a href={`${at}#friend`} data-go="friend">
            Why a friend
          </a>
          <a href={`${at}#tasks`} data-go="tasks">
            How it helps
          </a>
          <a href={JOIN_URL}>Get Krovvi</a>
        </nav>
        <nav className="ft-col" aria-label="Help">
          <b>Help</b>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Email us</a>
        </nav>
        <div className="ft-look">
          <b>Make it yours</b>
          <div className="sw4" role="group" aria-label="Colour">
            {DOTS.map((d) => (
              <button
                key={d.pick}
                type="button"
                className={`dot${d.pick === "mono" ? " mono" : ""}`}
                data-pick={d.pick}
                aria-label={d.label}
                style={d.a ? ({ "--a": d.a, "--b": d.b } as React.CSSProperties) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="ft-giant" id="ftGiant" aria-hidden="true">
        <div className="ftg-row" data-w={width.toFixed(2)} style={{ "--gr": (width / height).toFixed(4) } as React.CSSProperties}>
          {letters.map((l, i) => {
            const x0 = l.left - PAD;
            const w = l.right - l.left + PAD * 2;
            return (
              <span
                key={i}
                className="ftl"
                data-i={i}
                data-cx={((l.left + l.right) / 2 - left).toFixed(2)}
                data-lw={(l.right - l.left).toFixed(2)}
                style={{ left: `${(((x0 - left) / width) * 100).toFixed(3)}%`, width: `${((w / width) * 100).toFixed(3)}%` }}
              >
                <svg viewBox={`${x0.toFixed(2)} ${WORD_TOP} ${w.toFixed(2)} ${height.toFixed(2)}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`ftg${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={WORD_TOP} x2="0" y2={WORD_BOTTOM}>
                      <stop className="s0" offset="0" />
                      <stop className="s1" offset=".46" />
                      <stop className="s2" offset="1" />
                    </linearGradient>
                  </defs>
                  <g stroke={`url(#ftg${i})`} fill={`url(#ftg${i})`}>
                    {l.pieces.map((p, j) =>
                      "d" in p ? (
                        <path key={j} d={p.d} fill="none" strokeWidth={p.w.toFixed(2)} strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <circle key={j} cx={p.cx.toFixed(2)} cy={p.cy.toFixed(2)} r={p.r.toFixed(2)} stroke="none" />
                      )
                    )}
                  </g>
                </svg>
              </span>
            );
          })}
        </div>
      </div>
      <div className="ft-base">
        <span className="ft-c">© 2026 Krovvi</span>
        <a href={home ? "#top" : "/"} className="ft-home">
          <span>{home ? "Back to the top" : "Back home"}</span>
          <i aria-hidden="true" />
        </a>
        <span className="ft-c r">Your super friend.</span>
      </div>
    </footer>
  );
}
