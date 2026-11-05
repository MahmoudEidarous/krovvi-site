import { Baloo_2 } from "next/font/google";

import { JOIN_URL, SUPPORT_EMAIL } from "@/lib/site";

import { KTile, Wordmark } from "./brand";
import { LookMotion } from "./motion-client";

/**
 * Krovvi's face, as the app draws every word since 3 November 2026 (catch8 src/theme/type.ts): Baloo 2, its variable
 * file from Regular to ExtraBold, served from this site, never fetched from Google.
 */
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo", display: "swap" });

/**
 * Before the first paint: scripts are on, and the colour picked last time is set. The page is always light (its night
 * parts are night by design), so a phone's dark mode changes nothing. ?fresh forgets what you told the first phone. If
 * the page's script has not started four seconds later, everything it would have brought in is shown as it is.
 */
const BEFORE_PAINT = `(function(){var d=document.documentElement,t='purple';d.classList.add('js');try{var q=new URLSearchParams(location.search),s=q.get('theme')||localStorage.getItem('kl-theme');if(/^(purple|ocean|coral|mono)$/.test(s))t=s;if(q.has('fresh'))localStorage.removeItem('kl-you')}catch(e){}d.setAttribute('data-theme',t);setTimeout(function(){if(!window.__kl)d.classList.remove('js')},4000)})();`;

/** Every page in the new look: the colour, the ground, the top bar, the page, the foot, and the script that moves them. */
export function LookShell({ home, children }: { home: boolean; children: React.ReactNode }) {
  return (
    <div className={`kl ${baloo.variable}`} data-home={home ? "1" : "0"}>
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

/** The name as big as the page, letter by letter, so each can move on its own. */
const GIANT = [..."Krovvi"];

/**
 * The foot: the same night as the stage above it, no box around it. The links, your colour, the name as big as the page
 * in Krovvi's own face (its letters lean up toward your pointer, or jump when you tap them), and at the very bottom
 * the line a phone has for going home, which takes you back to the top.
 */
function Foot({ home }: { home: boolean }) {
  const at = home ? "" : "/";
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
          <div className="sw4" role="group" aria-label="Color">
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
        <div className="ftg-row">
          {GIANT.map((ch, i) => (
            <span key={i} className="ftl" data-i={i}>
              {ch}
            </span>
          ))}
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
