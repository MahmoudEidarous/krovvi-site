import { TAKEN, type Theme } from "@/lib/app-shots";

/**
 * Everything that moves on krovvi.com, ported from A2's a2.js (catch8 design/krovvi-new-look-2026-10-28/landing-a2),
 * whose smoothness rules hold here too: one frame loop for everything that follows the scroll or the pointer, reading
 * first and writing after; following a moving target the same way at 60 or 120 frames a second (1 - exp(-dt/tau));
 * transforms written straight onto elements; no blur on anything that moves. Where A2's phones played drawn kit screens
 * in iframes, these phones show the real app: pictures and films of its own screens, played when they are seen.
 *
 * startLook(root) sets it all up and returns the one call that takes it all down again.
 */

type Part = { read?: () => void; write: (dt: number) => boolean };

const THEMES: Theme[] = ["purple", "ocean", "coral", "mono"];

/** A real spring, sampled into a CSS linear() curve. */
function springCurve(stiffness: number, damping: number, n = 64): string {
  const dt = 1 / 600;
  const xs: number[] = [];
  let x = 0;
  let v = 0;
  let t = 0;
  while (t < 3) {
    v += (stiffness * (1 - x) - damping * v) * dt;
    x += v * dt;
    t += dt;
    xs.push(x);
    if (t > 0.25 && Math.abs(1 - x) < 0.0008 && Math.abs(v) < 0.01) break;
  }
  const pts = Array.from({ length: n + 1 }, (_, i) => +xs[Math.min(xs.length - 1, Math.round((i / n) * (xs.length - 1)))].toFixed(4));
  pts[0] = 0;
  pts[n] = 1;
  return `linear(${pts.join(", ")})`;
}

export function startLook(root: HTMLElement): () => void {
  const de = document.documentElement;
  const w = window as Window & { __kl?: boolean };
  w.__kl = true;
  de.classList.add("js");

  /* ---------- what is set up here is taken down here ---------- */
  const offs: (() => void)[] = [];
  let alive = true;
  offs.push(() => {
    alive = false;
  });
  const on = (t: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn as EventListener, opts);
    offs.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  const watch = (cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => {
    const o = new IntersectionObserver(cb, opts);
    offs.push(() => o.disconnect());
    return o;
  };
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      if (alive) fn();
    }, ms);
    offs.push(() => window.clearTimeout(t));
    return t;
  };

  const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => el.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => Array.from(el.querySelectorAll(s)) as T[];
  const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sleep = (ms: number) => new Promise<void>((r) => later(r, ms));
  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const isPhone = () => innerWidth <= 860;

  /* Two springs for the whole page: CALM settles without overshoot (big things), POP overshoots a touch (small things). */
  const hasLinear = typeof CSS !== "undefined" && CSS.supports("transition-timing-function", "linear(0, 1)");
  const CALM = hasLinear ? springCurve(170, 25.5) : "cubic-bezier(.22,.9,.24,1)";
  const POP = hasLinear ? springCurve(280, 19) : "cubic-bezier(.3,1.35,.5,1)";
  if (hasLinear) {
    de.style.setProperty("--calm", CALM);
    de.style.setProperty("--pop", POP);
  }
  /* Following a moving target the same way at 60 or 120 frames a second. */
  const follow = (cur: number, to: number, dt: number, tau: number) => {
    const n = cur + (to - cur) * (1 - Math.exp(-dt / tau));
    return Math.abs(to - n) < 1e-4 ? to : n;
  };
  const press = (el: Element | null) => {
    if (!reduce && el) el.animate([{ transform: "scale(1)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 360, easing: POP });
  };

  /* ---------- one frame loop: every part reads the page first, then writes ---------- */
  const parts: Part[] = [];
  let raf = 0;
  let last = 0;
  const run = (t: number) => {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(48, t - last) : 16.7;
    last = t;
    for (const p of parts) if (p.read) p.read();
    let more = false;
    for (const p of parts) if (p.write(dt)) more = true;
    if (more) raf = requestAnimationFrame(run);
    else last = 0;
  };
  const kick = () => {
    if (!raf && alive) raf = requestAnimationFrame(run);
  };
  offs.push(() => {
    if (raf) cancelAnimationFrame(raf);
  });
  on(window, "scroll", kick, { passive: true });

  /* Work that can wait waits for a pause in your scrolling, then for a quiet moment between frames, so it never lands in
     the middle of a scroll; after two seconds it goes ahead anyway. */
  let scrolledAt = 0;
  on(window, "scroll", () => {
    scrolledAt = performance.now();
  }, { passive: true });
  const quiet = (fn: () => void) => {
    const t0 = performance.now();
    const idle = (f: () => void) => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) ric(() => alive && f(), { timeout: 300 });
      else f();
    };
    const tick = () => {
      const now = performance.now();
      if (now - scrolledAt > 180 || now - t0 > 2000) idle(fn);
      else later(tick, 100);
    };
    tick();
  };

  /* ---------- the app's screens: the right colour's picture, and films that play when seen ---------- */
  const S = { theme: (THEMES.includes(de.dataset.theme as Theme) ? de.dataset.theme : "purple") as Theme };
  /** The colour a screen is shown in: yours, if that screen was taken in it, else purple. */
  const dirFor = (name: string, film: boolean): Theme => {
    const got = TAKEN[S.theme];
    const has = film ? got?.films?.[name] !== undefined : !!got?.stills?.includes(name);
    return has ? S.theme : "purple";
  };
  const stillOf = (name: string) => `/app/${dirFor(name, false)}/${name}.webp`;
  const filmOf = (name: string) => `/app/${dirFor(name, true)}/${name}.mp4`;
  const hasFilmNamed = (name: string) => TAKEN.purple?.films?.[name] !== undefined;
  const hasStillNamed = (name: string) => !!TAKEN.purple?.stills?.includes(name);
  /** Every picture and film on the page follows the colour. */
  const swapShots = () => {
    $$<HTMLImageElement>("img[data-shot]").forEach((im) => {
      const src = stillOf(im.dataset.shot!);
      if (im.getAttribute("src") !== src) im.src = src;
    });
    $$<HTMLVideoElement>("video[data-film]").forEach((v) => {
      const src = filmOf(v.dataset.film!);
      v.dataset.src = src;
      if (v.getAttribute("src") && v.getAttribute("src") !== src) v.src = src;
    });
  };

  /**
   * A screen plays its story: its first moment, then the film over it, then its last moment. The newest wish wins: a
   * screen told to stop (or to play again) mid-way never lands on an old film's end.
   */
  const story = new WeakMap<HTMLElement, number>();
  const filmIn = (sc: HTMLElement) => $<HTMLVideoElement>("video.sc-v", sc);
  const warm = (sc: HTMLElement | null) => {
    if (!sc) return;
    $$<HTMLImageElement>("img[loading=lazy]", sc).forEach((im) => {
      im.loading = "eager";
    });
    const v = filmIn(sc);
    if (v && !v.getAttribute("src") && v.dataset.src) {
      v.preload = "auto";
      v.src = v.dataset.src;
    }
  };
  const playScene = (sc: HTMLElement | null) => {
    if (!sc) return;
    const n = (story.get(sc) ?? 0) + 1;
    story.set(sc, n);
    const v = filmIn(sc);
    /* no film, less motion asked for, or no film yet in your colour (a purple film over an ocean page would clash): the
       screen's last moment, in your colour */
    if (!v || !v.dataset.src || reduce || (v.dataset.film && dirFor(v.dataset.film, true) !== S.theme)) {
      sc.dataset.show = "e";
      return;
    }
    warm(sc);
    sc.dataset.show = "a";
    const live = () => alive && story.get(sc) === n;
    v.onplaying = () => {
      if (live()) sc.dataset.show = "v";
    };
    v.onended = () => {
      if (live()) sc.dataset.show = "e";
    };
    v.onerror = () => {
      if (live()) sc.dataset.show = "e";
    };
    try {
      v.currentTime = 0;
    } catch {
      /* not loaded yet: it starts at its beginning anyway */
    }
    const p = v.play();
    // a phone that will not play films (Low Power Mode) shows the screen's last moment, so the answer is there
    if (p) p.catch(() => {
      if (live()) sc.dataset.show = "e";
    });
  };
  const holdScene = (sc: HTMLElement | null) => {
    if (!sc) return;
    story.set(sc, (story.get(sc) ?? 0) + 1);
    const v = filmIn(sc);
    if (v && !v.paused) v.pause();
  };
  /** A film stopped part way, as it stands: played on from there when seen again, or its last moment if it ended. */
  const resumeScene = (sc: HTMLElement | null) => {
    if (!sc) return;
    const v = filmIn(sc);
    if (sc.dataset.show !== "v" || !v) return;
    const n = (story.get(sc) ?? 0) + 1;
    story.set(sc, n);
    v.onended = () => {
      if (alive && story.get(sc) === n) sc.dataset.show = "e";
    };
    const p = v.play();
    if (p) p.catch(() => {
      if (alive && story.get(sc) === n) sc.dataset.show = "e";
    });
  };

  /* ---------- the top bar ---------- */
  const cap = $("#cap");
  const links = $("#capLinks");
  const capHl = links ? $(".cap-hl", links) : null;
  const capA = links ? $$<HTMLAnchorElement>("a", links) : [];
  let hoverA: HTMLElement | null = null;
  let curA: HTMLElement | null = null;
  const pillTo = (a: HTMLElement | null) => {
    if (!capHl) return;
    if (!a) {
      capHl.classList.remove("on");
      return;
    }
    capHl.style.translate = `${a.offsetLeft}px 0`;
    capHl.style.width = `${a.offsetWidth}px`;
    capHl.classList.add("on");
  };
  if (links) {
    on(links, "pointerover", (e) => {
      const a = (e.target as Element).closest("a") as HTMLElement | null;
      if (a) {
        hoverA = a;
        pillTo(a);
      }
    });
    on(links, "pointerleave", () => {
      hoverA = null;
      pillTo(curA);
    });
  }

  /* ---------- the colour: a new one sweeps out from where you tapped, phones and all ---------- */
  const tintMeta = () => document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  const paintHooks: (() => void)[] = [];
  const paint = () => {
    de.dataset.theme = S.theme;
    $$<HTMLElement>(".dot[data-pick]").forEach((b) => {
      b.classList.toggle("on", b.dataset.pick === S.theme);
      b.setAttribute("aria-pressed", b.dataset.pick === S.theme ? "true" : "false");
    });
    swapShots();
    const m = tintMeta();
    if (m) m.content = getComputedStyle(de).getPropertyValue("--bg2").trim() || m.content;
    paintHooks.forEach((h) => h());
  };
  const setLook = (theme: Theme, at: { x: number; y: number }) => {
    const apply = () => {
      S.theme = theme;
      try {
        localStorage.setItem("kl-theme", theme);
      } catch {
        /* a private window */
      }
      paint();
    };
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition;
    if (!vt || reduce) {
      apply();
      return;
    }
    const r = Math.hypot(Math.max(at.x, innerWidth - at.x), Math.max(at.y, innerHeight - at.y));
    const t = vt.call(document, apply);
    t.ready
      .then(() =>
        de.animate(
          { clipPath: [`circle(0px at ${at.x}px ${at.y}px)`, `circle(${r}px at ${at.x}px ${at.y}px)`] },
          { duration: 820, easing: "cubic-bezier(.22,.8,.2,1)", pseudoElement: "::view-transition-new(root)" }
        )
      )
      .catch(() => {});
  };
  on(document, "click", (e) => {
    const me = e as MouseEvent;
    const p = (me.target as Element).closest("[data-pick]") as HTMLElement | null;
    if (!p || !root.contains(p)) return;
    const theme = p.dataset.pick as Theme;
    if (!THEMES.includes(theme) || theme === S.theme) return;
    const r = p.getBoundingClientRect();
    setLook(theme, { x: me.clientX || r.left + r.width / 2, y: me.clientY || r.top + r.height / 2 });
  });

  /* the ways in lean toward your pointer, just a little */
  if (!reduce && fine) {
    $$(".getbig").forEach((b) => {
      on(b, "pointermove", (e) => {
        const pe = e as PointerEvent;
        const r = b.getBoundingClientRect();
        b.style.translate = `${(((pe.clientX - r.left) / r.width - 0.5) * 10).toFixed(1)}px ${(((pe.clientY - r.top) / r.height - 0.5) * 8).toFixed(1)}px`;
      });
      on(b, "pointerleave", () => {
        b.style.translate = "";
      });
    });
  }

  /* ---------- the first screen: the name huge, the real app talking in a phone in front of it ---------- */
  const st1 = $("#top");
  const heroL = $("#heroL");
  const title = $("#atitle");
  const slotH = $("#slotH");
  const heroPh = $("#heroPh");
  const acta = heroL ? $(".acta", heroL) : null;
  const heroDev = heroPh ? $(".dev", heroPh) : null;
  const heroScr = $("#heroScr");
  let heroCta = false;
  const face = () => {
    if (!document.fonts || !title) return Promise.resolve();
    const fam = getComputedStyle(title).fontFamily;
    return Promise.race([document.fonts.load(`900 100px ${fam}`).then(() => undefined), sleep(700)]).catch(() => undefined);
  };

  /* The name fills the width; the phone fills what is left under it. Measured, never guessed. */
  let lastW = 0;
  const layout = (force?: boolean) => {
    if (!st1 || !heroL || !title || !slotH || !heroPh) return;
    if (!force && innerWidth === lastW) return;
    lastW = innerWidth;
    const phone = isPhone();
    const vh = innerHeight;
    const cs = getComputedStyle(heroL);
    const W = heroL.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    title.style.setProperty("--fs", "100px");
    const rg = document.createRange();
    rg.selectNodeContents(title);
    const natural = phone ? Math.max(...$$(".ln", title).map((l) => l.getBoundingClientRect().width)) : rg.getBoundingClientRect().width;
    const fs = Math.min(phone ? 132 : 236, (100 * W * (phone ? 0.98 : 0.985)) / natural);
    title.style.setProperty("--fs", `${fs.toFixed(1)}px`);
    heroL.style.setProperty("--fs", `${fs.toFixed(1)}px`);
    let sH: number;
    if (phone) {
      slotH.style.setProperty("--hH", "10px");
      const top = slotH.getBoundingClientRect().top + scrollY;
      sH = Math.min(clamp((vh - top - (fine ? 18 : 62)) / 870, 0.48, 0.74), (W * 0.84) / 416);
    } else {
      const tb = title.getBoundingClientRect().top - st1.getBoundingClientRect().top + title.offsetHeight;
      sH = clamp((Math.max(vh, 640) - tb + fs * 0.14 - 40) / 870, 0.52, 0.9);
    }
    slotH.style.setProperty("--hW", `${(416 * sH).toFixed(1)}px`);
    slotH.style.setProperty("--hH", `${(870 * sH).toFixed(1)}px`);
    heroPh.style.transform = `scale(${sH.toFixed(4)})`;
    if (cap) cap.classList.toggle("solo", heroCta && !phone);
  };

  /* on a computer the phone leans a little toward your pointer */
  const TILT = { x: 0, y: 0, tx: 0, ty: 0, key: "" };
  if (heroDev) {
    parts.push({
      write(dt) {
        if (!fine || reduce) return false;
        TILT.x = follow(TILT.x, TILT.tx, dt, 160);
        TILT.y = follow(TILT.y, TILT.ty, dt, 160);
        const key = TILT.x.toFixed(2) + TILT.y.toFixed(2);
        if (key !== TILT.key) {
          TILT.key = key;
          heroDev.style.transform = `perspective(1800px) rotateX(${TILT.x.toFixed(2)}deg) rotateY(${TILT.y.toFixed(2)}deg)`;
        }
        return Math.abs(TILT.tx - TILT.x) + Math.abs(TILT.ty - TILT.y) > 0.01;
      },
    });
  }
  if (st1 && !reduce && fine) {
    on(st1, "pointermove", (e) => {
      const pe = e as PointerEvent;
      TILT.ty = clamp((pe.clientX / innerWidth - 0.5) * 2, -1, 1) * 7;
      TILT.tx = clamp((pe.clientY / innerHeight - 0.5) * 2, -1, 1) * -4;
      kick();
    });
    on(st1, "pointerleave", () => {
      TILT.tx = 0;
      TILT.ty = 0;
      kick();
    });
  }
  /* your pointer on the phone means you are using it: it turns to face you, so its screen is sharp to tap */
  if (slotH && fine) {
    on(slotH, "pointerenter", () => {
      TILT.tx = 0;
      TILT.ty = 0;
      kick();
    });
  }
  /* one way to get it at a time: while the first screen's own button shows, the top bar's steps aside */
  if (acta) {
    watch((es) => es.forEach((e) => {
      heroCta = e.isIntersecting;
      if (cap) cap.classList.toggle("solo", heroCta && !isPhone());
    }), { threshold: 0 }).observe(acta);
  }

  /* ---------- the first phone's talk: Krovvi has texted first, you answer with one of its real answers ---------- */
  const PICKS = ["great", "okay", "low"];
  const heroV = heroScr ? $<HTMLVideoElement>("video.sc-v", heroScr) : null;
  const heroE = heroScr ? $<HTMLImageElement>("img.sc-e", heroScr) : null;
  const hotspots = heroScr ? $$<HTMLButtonElement>(".hs", heroScr) : [];
  let heroRun = 0;
  let answered = false;
  /** What you told the first phone, kept on this device: next time, the chat is as you left it. */
  const you = (): string | null => {
    try {
      const t = (JSON.parse(localStorage.getItem("kl-you") || "null") || {}).t;
      return PICKS.includes(t) ? t : null;
    } catch {
      return null;
    }
  };
  const keep = (t: string) => {
    try {
      localStorage.setItem("kl-you", JSON.stringify({ t, at: Date.now() }));
    } catch {
      /* a private window */
    }
  };
  const showAnswered = (t: string) => {
    if (!heroScr || !heroE) return;
    const end = `hero-${t}-end`;
    if (!hasStillNamed(end)) return;
    heroE.dataset.shot = end;
    heroE.src = stillOf(end);
    heroE.alt = "Krovvi, the app: your answer and Krovvi's reply.";
    heroScr.dataset.show = "e";
    answered = true;
  };
  const answer = (t: string, btn: HTMLElement | null) => {
    if (!heroScr || answered) return;
    answered = true;
    const n = ++heroRun;
    keep(t);
    if (btn) {
      btn.classList.add("down");
      later(() => btn.classList.remove("down"), 160);
    }
    const end = `hero-${t}-end`;
    if (heroE && hasStillNamed(end)) {
      heroE.dataset.shot = end;
      heroE.src = stillOf(end);
      heroE.alt = "Krovvi, the app: your answer and Krovvi's reply.";
    }
    const film = `hero-${t}`;
    if (!heroV || !hasFilmNamed(film) || reduce || dirFor(film, true) !== S.theme) {
      heroScr.dataset.show = "e";
      return;
    }
    heroV.dataset.film = film;
    heroV.dataset.src = filmOf(film);
    heroV.preload = "auto";
    heroV.src = heroV.dataset.src;
    const live = () => alive && heroRun === n;
    heroV.onplaying = () => {
      if (live()) heroScr.dataset.show = "v";
    };
    heroV.onended = () => {
      if (live()) heroScr.dataset.show = "e";
    };
    heroV.onerror = () => {
      if (live()) heroScr.dataset.show = "e";
    };
    const p = heroV.play();
    if (p) p.catch(() => {
      if (live()) heroScr.dataset.show = "e";
    });
  };
  /** Back to Krovvi's question, to answer again. */
  const askAgain = () => {
    if (!heroScr) return;
    heroRun++;
    if (heroV && !heroV.paused) heroV.pause();
    heroScr.dataset.show = "a";
    answered = false;
    nudge();
  };
  /* until you answer, the three answers breathe once in turn, so it is clear they are yours to tap */
  let nudged = 0;
  const nudge = () => {
    if (reduce || answered || nudged > 1) return;
    nudged++;
    hotspots.forEach((h, i) =>
      later(() => {
        if (answered) return;
        h.classList.remove("nudge");
        void h.offsetWidth;
        h.classList.add("nudge");
      }, i * 240)
    );
  };
  hotspots.forEach((h) =>
    on(h, "click", (e) => {
      e.stopPropagation();
      answer(h.dataset.pick!, h);
    })
  );
  if (heroScr) {
    on(heroScr, "click", () => {
      if (heroScr.dataset.show === "e" && hotspots.length) askAgain();
    });
  }
  const remembered = you();
  if (remembered) showAnswered(remembered);
  /* the phone buzzes on the page when Krovvi texts you: two short shakes, the way a phone does on a table */
  const buzz = () => {
    if (reduce || !slotH) return;
    const kf = [{ translate: "0 0" }, { translate: "-3px 0", offset: 0.2 }, { translate: "3px 0", offset: 0.4 }, { translate: "-2px 0", offset: 0.6 }, { translate: "2px 0", offset: 0.8 }, { translate: "0 0" }];
    slotH.animate(kf, { duration: 240, easing: "linear" }).finished.then(() => {
      if (alive) slotH.animate(kf, { duration: 200, delay: 110, easing: "linear" });
    }).catch(() => {});
  };
  /* the first phone's film plays only while it is near; as you come back up it carries on from where it was */
  let heroNear = true;
  if (slotH) {
    watch((es) => es.forEach((e) => {
      heroNear = e.isIntersecting;
      if (!heroV) return;
      if (!heroNear && !heroV.paused) heroV.pause();
      else if (heroNear && heroScr?.dataset.show === "v" && heroV.paused && !heroV.ended) heroV.play().catch(() => {});
    }), { rootMargin: "35% 0px" }).observe(slotH);
  }

  /* what the friend part fetches once the first screen has made its entrance (set below) */
  let afterEntrance = () => {};
  /* The opening: the name rises letter by letter, the phone stands up in front of it, then the top bar drops in. */
  if (st1 && title && heroPh && slotH) {
    (async () => {
      await face();
      if (!alive) return;
      layout(true);
      await frame();
      if (!alive) return;
      title.classList.add("on");
      await sleep(reduce ? 0 : 180);
      heroPh.style.opacity = "1";
      /* it stands up in 3D on a computer; on a touch screen it rises flat */
      if (!reduce && fine && heroDev)
        heroDev.animate(
          [{ transform: "perspective(1800px) translateY(16vh) rotateX(22deg) scale(.93)", opacity: 0 }, { offset: 0.3, opacity: 1 }, { transform: "perspective(1800px)", opacity: 1 }],
          { duration: 1150, easing: CALM }
        );
      else if (!reduce) slotH.animate([{ transform: "translateY(70px)", opacity: 0 }, { offset: 0.3, opacity: 1 }, { transform: "none", opacity: 1 }], { duration: 1000, easing: CALM });
      await sleep(reduce ? 0 : 320);
      st1.classList.add("ready");
      cap?.classList.add("in");
      kick();
      await sleep(reduce ? 0 : 520);
      if (!remembered && heroNear) buzz();
      later(nudge, 2400);
      later(nudge, 9000);
      await sleep(900);
      afterEntrance();
    })();
  } else {
    cap?.classList.add("in");
  }
  if (document.fonts) {
    const fl = () => layout(true);
    document.fonts.addEventListener("loadingdone", fl);
    offs.push(() => document.fonts.removeEventListener("loadingdone", fl));
  }
  on(window, "resize", () => layout());

  /* ---------- a friend first: the night part, one phone, five of the app's own screens ---------- */
  const fr2 = $("#friend");
  const track = $("#frTrack");
  const pin2 = $("#pin2");
  const frPh = $("#frPh");
  const fws = $("#fws");
  const steps2 = $("#steps2");
  const s2hl = steps2 ? $(".s2-hl", steps2) : null;
  const N2 = 6;
  const SCR = frPh ? $$(".sc", frPh) : [];
  const OFF = frPh ? $(".sc-off", frPh) : null;
  const FRD = frPh ? $(".dev", frPh) : null;
  /* each screen's pictures are fetched ahead of time, one in each quiet moment once the first screen has made its
     entrance: nothing loads while you scroll */
  let warmed = 0;
  const preload2 = () => {
    if (warmed >= SCR.length) return;
    quiet(() => {
      warm(SCR[warmed]);
      warmed++;
      preload2();
    });
  };
  afterEntrance = preload2;
  let cur2 = -1;
  let tv2 = 0;
  let moving2 = false;
  let behind = -1;
  const putBehind = () => SCR.forEach((el, i) => el.classList.toggle("behind", i === behind && !el.classList.contains("on") && !moving2));
  /* The screen you see plays its film from its beginning; every other screen holds still. The next step's screen is
     drawn ahead, out of sight under the one you see, so a step change moves pictures that are already drawn. */
  const steer2 = (c: number) => {
    const k = c - 1;
    const n = c < N2 - 1 ? c : -1;
    SCR.forEach((sc, i) => {
      if (i === k) {
        if (cur2 !== k || sc.dataset.show === "e") playScene(sc);
      } else holdScene(sc);
    });
    if (n >= 0) warm(SCR[n]);
    behind = n;
    quiet(putBehind);
  };
  const hold2 = () => {
    SCR.forEach((sc) => holdScene(sc));
    behind = -1;
    putBehind();
  };
  const showOnly = (k: number) =>
    SCR.forEach((el, i) => {
      el.classList.toggle("on", i === k);
      if (i === k) el.classList.remove("behind");
      el.style.zIndex = "";
      el.style.transform = "";
      el.style.filter = "";
      el.style.opacity = "";
    });
  const IOS = "cubic-bezier(.32,.72,0,1)";
  /* Changing screens the way the phone does: it sleeps and wakes when Krovvi checks in, new chats slide in from the side.
     If you scroll fast, the newest wish wins at once. */
  const toScreen = async (k: number) => {
    const v = ++tv2;
    const live = () => alive && v === tv2;
    const from = cur2;
    SCR.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    if (OFF) {
      OFF.getAnimations().forEach((a) => a.cancel());
      OFF.style.opacity = "0";
    }
    cur2 = k;
    moving2 = true;
    SCR.forEach((el, i) => {
      if (i !== k) el.classList.remove("behind");
    });
    const done = () => {
      if (live()) {
        moving2 = false;
        quiet(putBehind);
      }
    };
    if (from < 0 || from === k || reduce) {
      showOnly(k);
      done();
      return;
    }
    const A = SCR[from];
    const B = SCR[k];
    const fwd = k > from;
    if (OFF && ((from === 0 && k === 1) || (from === 1 && k === 0))) {
      /* the screen sleeps, then wakes on the other one: Krovvi checking in is a text that wakes your phone */
      showOnly(from);
      await OFF.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
      if (!live()) return;
      showOnly(k);
      OFF.style.opacity = "1";
      OFF.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, easing: "ease-out", fill: "forwards" });
      await B.animate([{ transform: "scale(1.06)", filter: "brightness(.55)" }, { transform: "none", filter: "brightness(1)" }], { duration: 820, easing: CALM }).finished.catch(() => {});
      done();
      return;
    }
    /* a new chat slides in from the side, the old one steps back */
    A.classList.add("on");
    B.classList.add("on");
    A.style.zIndex = fwd ? "1" : "3";
    B.style.zIndex = fwd ? "3" : "1";
    const inA = fwd ? [{ transform: "none", opacity: 1 }, { transform: "translateX(-28%)", opacity: 0.45 }] : [{ transform: "none" }, { transform: "translateX(102%)" }];
    const inB = fwd ? [{ transform: "translateX(102%)" }, { transform: "none" }] : [{ transform: "translateX(-28%)", opacity: 0.45 }, { transform: "none", opacity: 1 }];
    A.animate(inA, { duration: 560, easing: IOS, fill: "forwards" });
    await B.animate(inB, { duration: 560, easing: IOS, fill: "forwards" }).finished.catch(() => {});
    if (!live()) return;
    showOnly(k);
    done();
  };

  /* Where the friend phone stands: on the right on a wide screen; on a phone, under the words. */
  let g2: { s: number; x: number; y: number } | null = null;
  let stepAt: [number, number][] = [];
  const stepBtns = steps2 ? $$<HTMLButtonElement>("button", steps2) : [];
  const measure2 = () => {
    if (!pin2 || !fws) return;
    const vw = pin2.clientWidth;
    const vh = pin2.clientHeight;
    if (isPhone()) {
      /* the phone fits under the words when it can; on a short screen it tucks its top under their fade */
      const wb = Math.max(...$$<HTMLElement>(".fw2", fws).filter((x) => x.dataset.c !== "0").map((x) => x.offsetTop + x.offsetHeight));
      const bottom = vh - (fine ? 22 : 78);
      const s = Math.min((vw * 0.66) / 416, clamp((bottom - wb - 16) / 870, 0.5, 0.66));
      g2 = { s, x: vw / 2 - 208 * s, y: bottom - 870 * s };
      fws.style.setProperty("--scrim", `${Math.round(wb + 70)}px`);
    } else {
      const s = clamp((vh * 0.8) / 870, 0.5, 0.86);
      g2 = { s, x: vw * 0.7 - 208 * s, y: vh * 0.52 - 435 * s };
    }
    stepAt = stepBtns.map((b) => [b.offsetLeft, b.offsetWidth]);
  };
  const pos2 = (hidden: boolean) => (g2 ? `translate3d(${g2.x.toFixed(1)}px, ${(g2.y + (hidden ? innerHeight * 0.9 : 0)).toFixed(1)}px, 0) scale(${g2.s.toFixed(4)})` : "");
  let ch = -1;
  let phoneUp = false;
  const setPhone = (up: boolean, anim = true) => {
    if (!g2 || !frPh) return;
    frPh.getAnimations().forEach((a) => a.cancel());
    /* rising: from below the screen to its place; going: back down */
    if (anim && !reduce && up !== phoneUp)
      frPh.animate([{ transform: pos2(up) }, { transform: pos2(!up) }], { duration: up ? 1000 : 560, easing: up ? CALM : "cubic-bezier(.5,0,.75,0)" });
    frPh.style.transform = pos2(!up);
    phoneUp = up;
  };
  const go2 = (c: number) => {
    if (c === ch || !pin2 || !fws) return;
    const prev = ch;
    ch = c;
    if (c >= N2) {
      hold2();
      return;
    }
    if (c < 0) {
      hold2();
      c = 0;
    } else steer2(c);
    pin2.dataset.c = String(c);
    $$<HTMLElement>(".fw2", fws).forEach((x) => x.classList.toggle("on", +x.dataset.c! === c));
    steps2?.classList.toggle("on", c >= 1);
    stepBtns.forEach((b) => {
      const is = +b.dataset.c! === c;
      b.classList.toggle("on", is);
      b.setAttribute("aria-pressed", is ? "true" : "false");
    });
    const at = stepAt[c - 1];
    if (s2hl && at && at[1]) {
      s2hl.style.translate = `${at[0]}px 0`;
      s2hl.style.width = `${at[1]}px`;
    }
    if (c === 0) {
      setPhone(false, prev > 0 && prev < N2);
      return;
    }
    const k = c - 1;
    if (!phoneUp) {
      showOnly(k);
      cur2 = k;
      setPhone(true, prev >= 0 && prev < N2);
    } else toScreen(k);
    if (!reduce && fine && phoneUp && prev >= 1 && prev < N2 && FRD)
      FRD.animate(
        [{ transform: "perspective(1800px) rotateY(0deg)" }, { transform: `perspective(1800px) rotateY(${c > prev ? -8 : 8}deg)`, offset: 0.42 }, { transform: "perspective(1800px) rotateY(0deg)" }],
        { duration: 760, easing: "cubic-bezier(.45,0,.25,1)" }
      );
  };
  let near2 = false;
  let want2 = -1;
  if (fr2 && track && pin2) {
    parts.push({
      read() {
        if (!near2) return;
        const r = track.getBoundingClientRect();
        const room = track.offsetHeight - pin2.offsetHeight;
        const v = (room > 0 ? clamp(-r.top / room) : 0) * N2 * 0.999;
        /* still below the screen, the part counts as not begun (-1); scrolled away above it, as over (N2) */
        want2 = r.top > innerHeight ? -1 : r.bottom < 0 ? N2 : Math.min(N2 - 1, Math.floor(v));
      },
      write() {
        if (near2) go2(want2);
        return false;
      },
    });
    on(window, "resize", () => {
      measure2();
      setPhone(phoneUp, false);
    });
    /* far from the part every film holds still, and the step is worked out afresh when you come back */
    watch((es) => es.forEach((e) => {
      near2 = e.isIntersecting;
      if (near2) {
        measure2();
        setPhone(phoneUp, false);
        kick();
      } else {
        hold2();
        ch = -1;
      }
    }), { rootMargin: "30% 0px" }).observe(fr2);
    stepBtns.forEach((b) => on(b, "click", () => toChapter(+b.dataset.c!)));
  }
  const toChapter = (c: number) => {
    if (!track || !pin2) return;
    const top = track.getBoundingClientRect().top + scrollY;
    const room = track.offsetHeight - pin2.offsetHeight;
    scrollTo({ top: top + room * ((c + 0.5) / N2), behavior: reduce ? "auto" : "smooth" });
  };

  /* ---------- then it helps: what's on your mind ticks off as you scroll, and the phone swipes between the answers ---------- */
  const hp = $("#tasks");
  const hpTrack = $("#hpTrack");
  const hpPin = $("#hpPin");
  const hpList = $("#hpList");
  const hpSlot = $("#hpSlot");
  const hpPh = $("#hpPh");
  const hpOne = $("#hpOne");
  const hpLis = hpList ? $$<HTMLLIElement>("li", hpList) : [];
  const NT = hpLis.length || 6;
  const GAP = 408;
  const hpHl = hpList ? $(".hp-hl", hpList) : null;
  const hpSegs = hpOne ? $$(".seg6 i", hpOne) : [];
  const hpLine = hpOne ? $(".one", hpOne) : null;
  const hpView = hpPh ? $(".hp-view", hpPh) : null;
  const hpStrip = hpPh ? $(".hp-strip", hpPh) : null;
  const TASK_WORDS = hpLis.map((l) => ({ q: $(".q", l)?.textContent ?? "", a: $(".a", l)?.textContent ?? "" }));
  let hpNear = false;
  const fitHp = () => {
    if (!hpPin || !hpSlot || !hpPh) return;
    const vh = hpPin.clientHeight;
    const vw = hpPin.clientWidth;
    let s: number;
    if (isPhone()) {
      hpSlot.style.setProperty("--ph", "10px");
      s = clamp(Math.min((vh - hpSlot.offsetTop - (fine ? 16 : 74)) / 870, (vw * 0.74) / 416), 0.36, 0.72);
    } else s = clamp((vh * 0.8) / 870, 0.5, 0.86);
    hpSlot.style.setProperty("--pw", `${(416 * s).toFixed(1)}px`);
    hpSlot.style.setProperty("--ph", `${(870 * s).toFixed(1)}px`);
    hpPh.style.transform = `scale(${s.toFixed(4)})`;
  };
  const HP = { u: 0, tu: 0, act: -1, drawn: false };
  const swipe = (f: number) => {
    const t = clamp((f - 0.32) / 0.36);
    return t * t * (3 - 2 * t);
  };
  let hpT = 0;
  const hpPut = (text: string, cls: string) => {
    if (!hpLine) return;
    const old = $$("span:not(.out)", hpLine);
    const n = document.createElement("span");
    n.className = `${cls} pre`;
    n.textContent = text;
    hpLine.appendChild(n);
    requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove("pre")));
    old.forEach((o) => {
      o.classList.add("out");
      later(() => o.remove(), 600);
    });
  };
  /* on a phone the list is one line: what's on your mind, then, a beat later, done */
  const hpSay = (i: number) => {
    const t = TASK_WORDS[i];
    if (!t) return;
    window.clearTimeout(hpT);
    hpPut(t.q, "q");
    hpT = later(() => hpPut(t.a, "a"), reduce ? 0 : 380);
  };
  const hpAct = (i: number) => {
    HP.act = i;
    hpLis.forEach((l, k) => {
      l.classList.toggle("done", k <= i);
      l.classList.toggle("on", k === i);
    });
    if (hpHl && hpLis[i]) {
      hpHl.style.transform = `translateY(${hpLis[i].offsetTop}px)`;
      hpHl.classList.add("live");
    }
    hpSegs.forEach((s, k) => s.classList.toggle("done", k <= i));
    hpSay(i);
  };
  const toTask = (i: number) => {
    if (!hpTrack || !hpPin) return;
    const top = hpTrack.getBoundingClientRect().top + scrollY;
    const room = hpTrack.offsetHeight - hpPin.offsetHeight;
    scrollTo({ top: top + room * (i ? (i - 0.06) / (NT - 1) : 0), behavior: reduce ? "auto" : "smooth" });
  };
  if (hp && hpTrack && hpPin && hpView && hpStrip) {
    watch((es) => {
      hpNear = es[0].isIntersecting;
      if (hpNear) {
        fitHp();
        HP.drawn = false;
        kick();
      }
    }, { rootMargin: "100% 0px" }).observe(hp);
    /* the words and the phone come up as the part arrives */
    watch((es) => es.forEach((e) => hp.classList.toggle("in", e.isIntersecting)), { threshold: 0.12 }).observe(hpPin);
    /* the pictures start loading while you are still in the part before, so the phone is never blank when it arrives */
    watch((es) => {
      if (es[0].isIntersecting && hpPh) $$<HTMLImageElement>("img[loading=lazy]", hpPh).forEach((im) => (im.loading = "eager"));
    }, { rootMargin: "0px 0px 300% 0px" }).observe(hp);
    on(window, "resize", fitHp);
    /* the scroll moves the row of answers; each one rests a while, then the next slides in quickly */
    parts.push({
      read() {
        if (!hpNear) return;
        const r = hpTrack.getBoundingClientRect();
        const room = hpTrack.offsetHeight - hpPin.offsetHeight;
        const v = (room > 0 ? clamp(-r.top / room) : 0) * (NT - 1);
        const k = Math.min(NT - 2, Math.floor(v));
        HP.tu = k + swipe(v - k);
      },
      write(dt) {
        if (!hpNear) return false;
        const n = reduce ? HP.tu : follow(HP.u, HP.tu, dt, 60);
        if (n === HP.u && HP.drawn) return false;
        HP.u = n;
        HP.drawn = true;
        /* between two answers the row steps back a little, the way apps do when you swipe between them */
        const t = n - Math.floor(n);
        const dip = reduce ? 0 : Math.sin(Math.PI * t) * 0.07;
        hpView.style.transform = `scale(${(1 - dip).toFixed(4)})`;
        hpStrip.style.transform = `translate3d(${(-n * GAP).toFixed(2)}px, 0, 0)`;
        const act = Math.round(n);
        if (act !== HP.act) hpAct(act);
        return HP.u !== HP.tu;
      },
    });
    if (hpList)
      on(hpList, "click", (e) => {
        const l = (e.target as Element).closest("li") as HTMLElement | null;
        if (l) {
          press(l);
          toTask(+l.dataset.i!);
        }
      });
    if (hpSlot) on(hpSlot, "click", () => toTask(Math.min(NT - 1, HP.act + 1)));
  }

  /* ---------- the end: the phone on a dark stage under one white light, saying hi the way the app does ---------- */
  const lt = $("#get");
  const ltRoom = $("#ltRoom");
  const ltStage = $("#ltStage");
  const ltAim = $("#ltAim");
  const ltPh = $("#ltPh");
  const ltScr = $("#ltScr");
  const ltFade = lt ? $(".lt-fade", lt) : null;
  const fitLt = () => {
    if (!ltStage || !ltPh) return;
    const phone = isPhone();
    const vh = innerHeight;
    const s = phone ? clamp(Math.min((vh - 330) / 870, (innerWidth * 0.64) / 416), 0.44, 0.64) : clamp((vh * 0.74) / 870, 0.55, 0.82);
    ltStage.style.setProperty("--pw", `${(416 * s).toFixed(1)}px`);
    ltStage.style.setProperty("--ph", `${(870 * s).toFixed(1)}px`);
    ltPh.style.setProperty("--s", s.toFixed(4));
  };
  /* With a mouse it drifts a little toward your pointer, in flat moves only, so its screen stays sharp; at rest it sits
     on whole screen pixels, where text is crispest. On its own it floats (look.css ltfloat). */
  const AIM = { x: 0, y: 0, tx: 0, ty: 0, key: "" };
  if (lt && ltRoom && ltStage && ltAim) {
    parts.push({
      write(dt) {
        if (!fine || reduce) return false;
        AIM.x = follow(AIM.x, AIM.tx, dt, 320);
        AIM.y = follow(AIM.y, AIM.ty, dt, 320);
        const moving = Math.abs(AIM.tx - AIM.x) + Math.abs(AIM.ty - AIM.y) > 0.05;
        const dpr = devicePixelRatio || 1;
        const px = (v: number) => (moving ? v : Math.round(v * dpr) / dpr).toFixed(2);
        const key = `${px(AIM.x)},${px(AIM.y)}`;
        if (key !== AIM.key) {
          AIM.key = key;
          ltAim.style.transform = `translate3d(${px(AIM.x)}px, ${px(AIM.y)}px, 0)`;
        }
        return moving;
      },
    });
    if (fine && !reduce) {
      on(ltRoom, "pointermove", (e) => {
        const pe = e as PointerEvent;
        const r = ltStage.getBoundingClientRect();
        AIM.tx = clamp((pe.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1) * 14;
        AIM.ty = clamp((pe.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1) * 8;
        kick();
      });
      on(ltRoom, "pointerleave", () => {
        AIM.tx = 0;
        AIM.ty = 0;
        kick();
      });
    }
    /* its hello is fetched while you are in the part before, and plays from its beginning every time you arrive */
    if (hp) watch((es) => {
      if (es[0].isIntersecting) quiet(() => warm(ltScr));
    }).observe(hp);
    watch((es) => es.forEach((e) => {
      if (e.isIntersecting) playScene(ltScr);
      else holdScene(ltScr);
    }), { threshold: 0.08 }).observe(ltRoom);
    watch((es) => es.forEach((e) => lt.classList.toggle("in", e.isIntersecting)), { threshold: 0.35 }).observe(ltRoom);
    on(window, "resize", fitLt);
  }

  /* ---------- the foot: the name as big as the page; its letters lean up toward your pointer, or jump when tapped ---------- */
  const ft = $("#ft");
  const giant = $("#ftGiant");
  const gRow = giant ? $(".ftg-row", giant) : null;
  /* A2's units, so the springs feel the same: a letter's box is 320 tall */
  const FONT = 400;
  const GH = FONT * 0.8;
  const gW = gRow ? parseFloat(gRow.dataset.w || "1") : 1;
  type L = { g: HTMLElement; cx: number; w: number; y: number; v: number; s: number; vs: number; hold: boolean };
  const letters: L[] = giant
    ? $$<HTMLElement>(".ftl", giant).map((g) => ({ g, cx: parseFloat(g.dataset.cx || "0"), w: parseFloat(g.dataset.lw || "1"), y: 0, v: 0, s: 1, vs: 0, hold: false }))
    : [];
  const placeLetter = (L: L) => {
    L.g.style.transform = `translate3d(0, ${((L.y / GH) * 100).toFixed(3)}%, 0) scale(${L.s.toFixed(4)})`;
  };
  const FT = { on: false, px: null as number | null };
  if (giant && ft && letters.length) {
    parts.push({
      write(dt) {
        if (!FT.on) return false;
        const sec = Math.min(dt, 34) / 1000;
        let moving = false;
        letters.forEach((L) => {
          /* a letter waiting for its turn stays where it is, out of sight */
          if (L.hold) return;
          let ty = 0;
          let ts = 1;
          if (FT.px !== null) {
            const f = Math.max(0, 1 - Math.abs(FT.px - L.cx) / (L.w * 1.35));
            const k = f * f * (3 - 2 * f);
            ty = -k * FONT * 0.12;
            ts = 1 + k * 0.05;
          }
          /* a real spring per letter, in small steps so it stays smooth at any frame rate */
          for (let n = 0; n < 2; n++) {
            const h = sec / 2;
            L.v += (220 * (ty - L.y) - 20 * L.v) * h;
            L.y += L.v * h;
            L.vs += (260 * (ts - L.s) - 22 * L.vs) * h;
            L.s += L.vs * h;
          }
          if (Math.abs(ty - L.y) > 0.05 || Math.abs(L.v) > 0.05 || Math.abs(ts - L.s) > 0.0005 || Math.abs(L.vs) > 0.001) moving = true;
          placeLetter(L);
        });
        return moving;
      },
    });
    /* the pointer only on a mouse or trackpad; a finger scrolling past must never set things moving */
    if (fine) {
      on(ft, "pointermove", (e) => {
        const pe = e as PointerEvent;
        const g = giant.getBoundingClientRect();
        FT.px = pe.clientY > g.top - g.height * 0.3 && pe.clientY < g.bottom + 20 ? (pe.clientX - g.left) * (gW / g.width) : null;
        kick();
      });
      on(ft, "pointerleave", () => {
        FT.px = null;
        kick();
      });
    }
    on(giant, "click", (e) => {
      const g = (e.target as Element).closest(".ftl") as HTMLElement | null;
      if (!g || reduce) return;
      const L = letters[+g.dataset.i!];
      if (!L) return;
      L.v -= FONT * 2.4;
      L.vs += 1;
      kick();
    });
    watch((es) => es.forEach((e) => {
      FT.on = e.isIntersecting;
      if (!e.isIntersecting) return;
      if (!giant.classList.contains("on")) {
        /* the letters come up one after another, each settling on its own spring; until its turn each waits, hidden,
           just below its place */
        if (!reduce)
          letters.forEach((L, i) => {
            L.hold = true;
            L.y = FONT * 0.45;
            L.v = 0;
            L.s = 0.92;
            placeLetter(L);
            L.g.classList.add("wait");
            later(() => {
              L.hold = false;
              L.v = -FONT * 1.1;
              L.g.classList.remove("wait");
              kick();
            }, 80 + i * 75);
          });
        giant.classList.add("on");
      }
      kick();
    }), { threshold: 0.15 }).observe(giant);
  }

  /* ---------- the top bar's state, and the page's own links ---------- */
  const NAV = { dark: false, small: false, cur: null as HTMLElement | null, end: false, endWas: null as boolean | null };
  paintHooks.push(() => {
    NAV.endWas = null;
    kick();
  });
  const frOut = fr2 ? $(".fr2-out", fr2) : null;
  const darkTops = $$("[data-mode='dark']");
  parts.push({
    read() {
      const vh = innerHeight;
      NAV.small = scrollY > 30;
      if (track && hp) {
        const r = track.getBoundingClientRect();
        const t = hp.getBoundingClientRect();
        /* dark over the friend part, and again from the stage to the end */
        NAV.dark = (r.top < 40 && r.bottom + (frOut?.offsetHeight ?? 0) * 0.45 > 40) || (!!lt && lt.getBoundingClientRect().top + (ltFade?.offsetHeight ?? 0) * 0.55 < 40);
        const inFriend = r.top < vh * 0.5 && r.bottom > vh * 0.5;
        const inTasks = t.top < vh * 0.5 && t.bottom > vh * 0.5;
        NAV.cur = inFriend ? capA[0] ?? null : inTasks ? capA[1] ?? null : null;
      } else {
        NAV.dark = darkTops.some((d) => {
          const r = d.getBoundingClientRect();
          return r.top < 40 && r.bottom > 40;
        });
      }
      NAV.end = ltRoom ? ltRoom.getBoundingClientRect().top < vh * 0.5 : ft ? ft.getBoundingClientRect().top < vh * 0.5 : false;
    },
    write() {
      if (cap) {
        cap.classList.toggle("dark", NAV.dark);
        cap.classList.toggle("small", NAV.small);
      }
      /* From the stage down the page is night, so whatever shows past its end (an iPhone's bars take this colour) is
         night too. Changing it redraws the whole screen, so it waits for a pause in your scrolling. */
      if (NAV.end !== NAV.endWas) {
        const end = (NAV.endWas = NAV.end);
        quiet(() => {
          if (NAV.end !== end) return;
          const night = getComputedStyle(ltRoom ?? ft ?? root).backgroundColor;
          de.style.backgroundColor = end ? night : "";
          const m = tintMeta();
          if (m) m.content = end ? night : getComputedStyle(de).getPropertyValue("--bg2").trim();
        });
      }
      if (NAV.cur !== curA) {
        curA = NAV.cur;
        capA.forEach((a) => a.classList.toggle("cur", a === curA));
        if (!hoverA) pillTo(curA);
      }
      return false;
    },
  });
  on(document, "click", (e) => {
    const me = e as MouseEvent;
    if (me.defaultPrevented || me.button !== 0 || me.metaKey || me.ctrlKey || me.shiftKey || me.altKey) return;
    const el = me.target as Element;
    const top = el.closest('a[href="#top"]') as HTMLElement | null;
    if (top && root.contains(top)) {
      me.preventDefault();
      /* the line at the very bottom flicks up first, the way you swipe home on a phone */
      const line = top.classList.contains("ft-home") ? $("i", top) : null;
      if (!reduce && line) line.animate([{ transform: "none" }, { transform: "translateY(-16px) scaleX(.86)", offset: 0.38 }, { transform: "none" }], { duration: 560, easing: CALM });
      scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    const a = el.closest("[data-go]") as HTMLElement | null;
    if (!a || !root.contains(a)) return;
    if (a.dataset.go === "tasks" && hpTrack) {
      me.preventDefault();
      toTask(0);
    } else if (a.dataset.go === "friend" && track) {
      me.preventDefault();
      toChapter(0);
    }
  });

  /* ---------- set it all up ---------- */
  measure2();
  fitHp();
  fitLt();
  const settle = () => {
    if (!alive) return;
    layout(true);
    measure2();
    setPhone(phoneUp, false);
    fitHp();
    fitLt();
    kick();
  };
  if (document.fonts) document.fonts.ready.then(settle).catch(() => {});
  else settle();
  paint();
  kick();

  return () => {
    for (const f of offs.splice(0)) {
      try {
        f();
      } catch {
        /* already gone */
      }
    }
  };
}
