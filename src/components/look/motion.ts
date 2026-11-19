import { TAKEN, type Theme } from "@/lib/app-shots";

/**
 * Everything that moves on krovvi.com (the home of 19 November 2026; its smoothness rules are A2's): one frame loop for
 * everything that follows the scroll or the pointer, reading first and writing after; following a moving target the
 * same way at 60 or 120 frames a second (1 - exp(-dt/tau)); transforms written straight onto elements; no blur on
 * anything that moves. The phones show the real app: pictures and films of its own screens, played when they are seen.
 * Sizes are the stylesheet's own (a phone is as tall as it is given), so nothing here measures a phone.
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
  /** A picture's two sizes, in the colour it is shown in. */
  const setOf = (name: string) => {
    const dir = dirFor(name, false);
    return `/app/${dir}/${name}.webp 804w, /app/${dir}/${name}@3x.webp 1206w`;
  };
  /** One of the app's screens put in a picture's place. */
  const setShot = (im: HTMLImageElement, name: string) => {
    im.dataset.shot = name;
    im.srcset = setOf(name);
    im.src = stillOf(name);
    if (!im.sizes) im.sizes = "(max-width: 860px) 86vw, 420px";
  };
  const swapShots = () => {
    $$<HTMLImageElement>("img[data-shot]").forEach((im) => {
      const src = stillOf(im.dataset.shot!);
      if (im.getAttribute("src") !== src) {
        im.srcset = setOf(im.dataset.shot!);
        im.src = src;
      }
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

  /* parts that come in when they are seen: a title rising, a line fading up (home.css .rise, .fade) */
  $$("[data-in]").forEach((el) => {
    watch((es) => es.forEach((e) => {
      if (e.isIntersecting) el.classList.add("in");
    }), { threshold: 0.3 }).observe(el);
  });

  /* ---------- 1. the first screen: the name huge, the real app talking in a phone in front of it ---------- */
  const hero = $("#top");
  const heroIn = $("#heroIn");
  const title = $("#atitle");
  const heroPh = $("#heroPh");
  const acta = heroIn ? $(".acta", heroIn) : null;
  const heroDev = heroPh ? $(".dev", heroPh) : null;
  const heroScr = $("#heroScr");
  let heroCta = false;
  const face = () => {
    if (!document.fonts || !title) return Promise.resolve();
    const fam = getComputedStyle(title).fontFamily;
    return Promise.race([document.fonts.load(`800 100px ${fam}`).then(() => undefined), sleep(700)]).catch(() => undefined);
  };

  /* The name fills the width: measured, never guessed. The phone's size is the stylesheet's own (look.css --ph). */
  let lastW = 0;
  const layout = (force?: boolean) => {
    if (!heroIn || !title) return;
    if (!force && innerWidth === lastW) return;
    lastW = innerWidth;
    const phone = isPhone();
    const cs = getComputedStyle(heroIn);
    const W = heroIn.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    title.style.fontSize = "100px";
    /* the words' own width, whatever box they sit in: one line on a computer, the longer of two on a phone */
    const wide = (el: Element) => {
      const rg = document.createRange();
      rg.selectNodeContents(el);
      return rg.getBoundingClientRect().width;
    };
    const natural = phone ? Math.max(...$$(".ln", title).map(wide)) : wide(title);
    title.style.fontSize = "";
    if (!natural) return;
    const fs = Math.min(phone ? 132 : 250, (100 * W * (phone ? 0.98 : 0.985)) / natural);
    heroIn.style.setProperty("--fs", `${fs.toFixed(1)}px`);
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
  if (hero && !reduce && fine) {
    on(hero, "pointermove", (e) => {
      const pe = e as PointerEvent;
      TILT.ty = clamp((pe.clientX / innerWidth - 0.5) * 2, -1, 1) * 6;
      TILT.tx = clamp((pe.clientY / innerHeight - 0.5) * 2, -1, 1) * -3;
      kick();
    });
    on(hero, "pointerleave", () => {
      TILT.tx = 0;
      TILT.ty = 0;
      kick();
    });
  }
  /* your pointer on the phone means you are using it: it turns to face you, so its screen is sharp to tap */
  if (heroPh && fine) {
    on(heroPh, "pointerenter", () => {
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
  const endOf = (t: string) => {
    const end = `hero-${t}-end`;
    if (!heroE || !hasStillNamed(end)) return false;
    setShot(heroE, end);
    heroE.alt = "Krovvi, the app: your answer and Krovvi's reply.";
    return true;
  };
  const showAnswered = (t: string) => {
    if (!heroScr || !endOf(t)) return;
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
    endOf(t);
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
    if (reduce || !heroPh) return;
    const kf = [{ translate: "0 0" }, { translate: "-3px 0", offset: 0.2 }, { translate: "3px 0", offset: 0.4 }, { translate: "-2px 0", offset: 0.6 }, { translate: "2px 0", offset: 0.8 }, { translate: "0 0" }];
    heroPh.animate(kf, { duration: 240, easing: "linear" }).finished.then(() => {
      if (alive) heroPh.animate(kf, { duration: 200, delay: 110, easing: "linear" });
    }).catch(() => {});
  };
  /* the first phone's film plays only while it is near; as you come back up it carries on from where it was */
  let heroNear = true;
  if (heroPh) {
    watch((es) => es.forEach((e) => {
      heroNear = e.isIntersecting;
      if (!heroV) return;
      if (!heroNear && !heroV.paused) heroV.pause();
      else if (heroNear && heroScr?.dataset.show === "v" && heroV.paused && !heroV.ended) heroV.play().catch(() => {});
    }), { rootMargin: "20% 0px" }).observe(heroPh);
  }

  /* what the next parts fetch once the first screen has made its entrance (set below) */
  let afterEntrance = () => {};
  /* The opening: the name rises letter by letter, the phone stands up in front of it, then the top bar drops in. */
  if (hero && title && heroPh) {
    (async () => {
      await face();
      if (!alive) return;
      layout(true);
      await frame();
      if (!alive) return;
      title.classList.add("on");
      await sleep(reduce ? 0 : 180);
      /* in a colour of your own the phone waits for its picture in that colour (a moment at most), so purple never shows first */
      const first = S.theme !== "purple" && heroScr ? $<HTMLImageElement>("img.sc-a", heroScr) : null;
      if (first) await Promise.race([first.decode().catch(() => {}), sleep(1200)]);
      if (!alive) return;
      heroPh.style.opacity = "1";
      /* it stands up in 3D on a computer; on a touch screen it rises flat */
      if (!reduce && fine && heroDev)
        heroDev.animate(
          [{ transform: "perspective(1800px) translateY(16vh) rotateX(22deg) scale(.93)", opacity: 0 }, { offset: 0.3, opacity: 1 }, { transform: "perspective(1800px)", opacity: 1 }],
          { duration: 1150, easing: CALM }
        );
      else if (!reduce) heroPh.animate([{ transform: "translateY(70px)", opacity: 0 }, { offset: 0.3, opacity: 1 }, { transform: "none", opacity: 1 }], { duration: 1000, easing: CALM });
      await sleep(reduce ? 0 : 320);
      hero.classList.add("ready");
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

  /* ---------- the sheets: as a part slides up over the one before, that one steps back a little and dims ---------- */
  type Back = { sheet: HTMLElement; back: HTMLElement; shade: HTMLElement | null; p: number; key: string };
  const backs: Back[] = [];
  const stepsBack = (sheet: HTMLElement | null, back: HTMLElement | null) => {
    if (!sheet || !back || reduce) return;
    backs.push({ sheet, back, shade: $(":scope > .shade", back), p: 0, key: "" });
  };
  parts.push({
    read() {
      const vh = innerHeight;
      /* on a phone the page simply scrolls: a part is never held back under the next */
      const still = isPhone();
      for (const b of backs) b.p = still ? 0 : clamp(1 - b.sheet.getBoundingClientRect().top / vh);
    },
    write() {
      for (const b of backs) {
        const key = b.p.toFixed(3);
        if (key === b.key) continue;
        b.key = key;
        /* it falls behind by a part of the scroll: the sheet is in front, moving faster */
        b.back.style.transform = b.p > 0 ? `translate3d(0, ${(b.p * innerHeight * 0.3).toFixed(1)}px, 0)` : "";
        if (b.shade) b.shade.style.opacity = (b.p * 0.55).toFixed(3);
      }
      return false;
    },
  });

  /* ---------- 2. a friend first: the night sheet, one phone, five of the app's own moments ---------- */
  const fr = $("#friend");
  const track = $("#frTrack");
  const pin = $("#frPin");
  const frPh = $("#frPh");
  const frWords = $("#frWords");
  const frSteps = $("#frSteps");
  const fsHl = frSteps ? $(".fs-hl", frSteps) : null;
  const FW = frWords ? $$(".fw", frWords) : [];
  const SCR = frPh ? $$(".sc", frPh) : [];
  const TABS = frSteps ? $$<HTMLButtonElement>("button", frSteps) : [];
  const N2 = FW.length; // the opening words, then one for each screen
  stepsBack(fr, heroIn);
  /* each screen's pictures are fetched ahead of time, one in each quiet moment once the first screen has made its
     entrance: nothing loads while you scroll */
  let warmed = 0;
  const warmFriend = () => {
    if (warmed >= SCR.length) return;
    quiet(() => {
      warm(SCR[warmed]);
      warmed++;
      warmFriend();
    });
  };
  afterEntrance = warmFriend;
  let cur2 = -1;
  let want2 = 0;
  const tabTo = (c: number) => {
    const b = TABS[c - 1];
    TABS.forEach((t) => t.classList.toggle("on", t === b));
    if (!fsHl || !b) return;
    fsHl.style.translate = `${b.offsetLeft}px 0`;
    fsHl.style.width = `${b.offsetWidth}px`;
  };
  const setChapter = (c: number) => {
    if (c === cur2 || !pin) return;
    const from = cur2;
    cur2 = c;
    pin.dataset.c = String(c);
    pin.classList.toggle("up", c >= 1);
    FW.forEach((w) => w.classList.toggle("on", Number(w.dataset.c) === c));
    frSteps?.classList.toggle("on", c >= 1);
    if (c >= 1) tabTo(c);
    const k = c - 1;
    if (frPh) frPh.dataset.dir = c >= from ? "fwd" : "back";
    SCR.forEach((sc, i) => {
      sc.classList.toggle("on", i === k);
      /* the ones already seen wait on the left, the ones to come on the right */
      sc.classList.toggle("was", i < k);
      if (i === k) {
        /* a moment for the screen to slide in (longer for the first, which comes up with the phone), then its film
           from the start */
        later(() => {
          if (cur2 === c) playScene(sc);
        }, reduce ? 0 : from <= 0 ? 950 : 380);
      } else holdScene(sc);
    });
    /* the screen at the opening is the first one, already in place as the phone comes up */
    if (c === 0 && SCR[0]) SCR[0].dataset.show = "a";
  };
  /* on a phone the words sit over the top of the phone: the phone starts under the tallest words */
  const measure2 = () => {
    if (!pin || !frWords) return;
    if (!isPhone()) {
      pin.style.removeProperty("--phTop");
      frWords.style.removeProperty("--scrim");
      return;
    }
    let bottom = 0;
    FW.forEach((w) => {
      if (w.dataset.c === "0") return;
      bottom = Math.max(bottom, w.offsetTop + w.offsetHeight);
    });
    pin.style.setProperty("--phTop", `${Math.round(bottom + 18)}px`);
    frWords.style.setProperty("--scrim", `${Math.round(bottom + 54)}px`);
  };
  if (fr && track && pin) {
    parts.push({
      read() {
        const r = track.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        /* the opening words hold for a shorter stretch than each screen */
        const first = 0.5 / (N2 - 0.5);
        want2 = p < first ? 0 : Math.min(N2 - 1, 1 + Math.floor(((p - first) / (1 - first)) * (N2 - 1)));
        /* before the sheet has come up, nothing has started */
        if (r.top > innerHeight * 0.55) want2 = 0;
      },
      write() {
        setChapter(want2);
        return false;
      },
    });
    const toChapter = (c: number) => {
      const r = track.getBoundingClientRect();
      const span = r.height - innerHeight;
      const first = 0.5 / (N2 - 0.5);
      const p = c === 0 ? 0 : first + ((c - 1 + 0.4) / (N2 - 1)) * (1 - first);
      scrollTo({ top: scrollY + r.top + p * span, behavior: reduce ? "auto" : "smooth" });
    };
    TABS.forEach((b) =>
      on(b, "click", () => {
        press(b);
        toChapter(Number(b.dataset.c));
      })
    );
    on(window, "resize", measure2);
  }

  /* ---------- 3. it plays: the row of games moves sideways as you scroll down past it ---------- */
  const plRail = $("#plRail");
  const plRow = $("#plRow");
  const PL = { x: 0, key: "" };
  if (plRail && plRow && !reduce) {
    parts.push({
      read() {
        /* on a phone the row is swiped by hand */
        if (isPhone()) {
          PL.x = 0;
          return;
        }
        const r = plRail.getBoundingClientRect();
        const vh = innerHeight;
        const p = clamp((vh - r.top) / (vh + r.height));
        const room = Math.max(0, plRow.scrollWidth - innerWidth);
        /* it starts a little in from the right, and ends with its last game in view */
        PL.x = innerWidth * 0.12 - p * (room + innerWidth * 0.12);
      },
      write() {
        const key = PL.x.toFixed(1);
        if (key !== PL.key) {
          PL.key = key;
          plRow.style.transform = PL.x ? `translate3d(${key}px, 0, 0)` : "";
        }
        return false;
      },
    });
  }

  /* a row that is tapped is also chosen from the keys: Return or Space does what a tap does */
  const byKey = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key !== "Enter" && ke.key !== " ") return;
    ke.preventDefault();
    (ke.currentTarget as HTMLElement).click();
  };

  /* ---------- 4. just say it: the chat is the page itself scrolling inside the phone; the words beside it follow ---------- */
  const say = $("#chat");
  const sayFeed = $("#sayFeed");
  const sayNow = $("#sayNow");
  const sayIndex = $("#sayIndex");
  const siHl = sayIndex ? $(".si-hl", sayIndex) : null;
  const XS = sayFeed ? $$("li", sayFeed) : [];
  const SN = sayNow ? $$(".sn", sayNow) : [];
  const SI = sayIndex ? $$("li", sayIndex) : [];
  stepsBack(say, $("#plIn"));
  let sayCur = -1;
  let sayWant = 0;
  const sayTo = (i: number) => {
    if (i === sayCur) return;
    sayCur = i;
    SN.forEach((el, k) => {
      el.classList.toggle("on", k === i);
      el.classList.toggle("was", k < i);
    });
    SI.forEach((el, k) => el.classList.toggle("on", k === i));
    const li = SI[i];
    if (siHl && li) {
      siHl.style.translate = `0 ${li.offsetTop}px`;
      siHl.style.width = `${li.offsetWidth}px`;
    }
    /* the card in front moves as it does in the app (a step ticked, a glass added, a timer running): its film plays
       once over its picture and stays at its end; the others go back to their pictures */
    XS.forEach((x, k) => {
      const v = x.querySelector("video") as HTMLVideoElement | null;
      if (!v) return;
      if (k !== i) {
        if (!v.paused) v.pause();
        x.classList.remove("playing");
        return;
      }
      if (reduce || !v.dataset.src || (v.dataset.film && dirFor(v.dataset.film, true) !== S.theme)) return;
      if (!v.getAttribute("src")) {
        v.preload = "auto";
        v.src = v.dataset.src;
      }
      later(() => {
        if (sayCur !== i || !alive) return;
        v.onplaying = () => {
          if (sayCur === i) x.classList.add("playing");
        };
        try {
          v.currentTime = 0;
        } catch {
          /* not loaded yet: it starts at its beginning anyway */
        }
        v.play().catch(() => {});
      }, 650);
    });
  };
  if (say && XS.length) {
    parts.push({
      read() {
        /* the exchange in front is the one nearest the middle of the screen */
        const mid = innerHeight * 0.5;
        let best = 0;
        let dist = Infinity;
        XS.forEach((li, i) => {
          const r = li.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        sayWant = best;
      },
      write() {
        sayTo(sayWant);
        return false;
      },
    });
    SI.forEach((li, i) => {
      on(li, "click", () => {
        const x = XS[i];
        if (!x) return;
        const r = x.getBoundingClientRect();
        scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: reduce ? "auto" : "smooth" });
      });
      on(li, "keydown", byKey);
    });
    on(window, "resize", () => {
      sayCur = -1;
      kick();
    });
  }

  /* ---------- 5. the whole picture: a deck of the apps' own pages; scrolling deals the next, and its ground and name follow ---------- */
  const ap = $("#apps");
  const apTrack = $("#apTrack");
  const apPin = $("#apPin");
  const apDeck = $("#apDeck");
  const apCards = apDeck ? $$(".ap-card", apDeck) : [];
  const apVeils = apCards.map((c) => $(".veil", c));
  const apTones = $$("#apTones i");
  const AN = $$("#apNames .an");
  const AD = $$("#apDots li");
  const M = apCards.length;
  const AP = { pos: 0, key: "", cur: -1, w: 0, peek: 0, tone: [] as string[], shown: [] as boolean[] };
  /** How long the last app stands at the end, in stretches of the scroll (the others hold 0.38 of theirs). */
  const AP_REST = 0.45;
  const apMeasure = () => {
    /* a card's width and how far the next one shows from behind it, in px: both are the stylesheet's own */
    AP.w = apCards[0]?.offsetWidth ?? 0;
    AP.peek = apDeck ? parseFloat(getComputedStyle(apDeck).getPropertyValue("--peek")) || (apDeck.offsetWidth - AP.w) / 3 : 0;
    if (apDeck && !(AP.peek > 0)) AP.peek = Math.max(0, (apDeck.offsetWidth - AP.w) / 3);
    AP.key = "";
  };
  const apTo = (i: number) => {
    if (i === AP.cur) return;
    AP.cur = i;
    AN.forEach((el, k) => {
      el.classList.toggle("on", k === i);
      el.classList.toggle("was", k < i);
    });
    AD.forEach((el, k) => el.classList.toggle("on", k === i));
  };
  /* where the deck stands for a place between two apps: every card's place, turn, size and dimness */
  const deal = (pos: number) => {
    for (let i = 0; i < M; i++) {
      const card = apCards[i];
      const d = i - pos;
      const seen = d > -1.02 && d < 3.7;
      if (!seen) {
        if (AP.shown[i] !== false) {
          AP.shown[i] = false;
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
        }
        continue;
      }
      AP.shown[i] = true;
      let x: number;
      let y = 0;
      let turn: number;
      let size: number;
      let o = 1;
      let veil = 0;
      if (d >= 0) {
        /* waiting behind: each a step to the right, a little smaller, a little turned, a little dimmer */
        const k = Math.min(d, 3);
        x = k * AP.peek * 1.18;
        turn = k * 1.6;
        size = 1 - k * 0.07;
        veil = k * 0.2;
        if (d > 3) o = clamp(1 - (d - 3) / 0.6);
      } else {
        /* dealt: off to the left with a turn of the wrist, gone before it would be in the words' way */
        const t = -d;
        x = -t * AP.w * 1.3;
        y = t * AP.w * 0.1;
        turn = -t * 12;
        size = 1 - t * 0.04;
        o = clamp(1 - (t - 0.3) / 0.5);
      }
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${turn.toFixed(2)}deg) scale(${size.toFixed(4)})`;
      card.style.opacity = o.toFixed(3);
      card.style.pointerEvents = Math.abs(d) < 0.5 ? "auto" : "none";
      const v = apVeils[i];
      if (v) v.style.opacity = veil.toFixed(3);
    }
    /* each app's ground, the one in front over the one before */
    for (let i = 0; i < apTones.length; i++) {
      const o = i === 0 ? "1" : clamp(pos - (i - 1)).toFixed(3);
      if (AP.tone[i] !== o) {
        AP.tone[i] = o;
        apTones[i].style.opacity = o;
      }
    }
  };
  if (ap && apTrack && apPin && apDeck && M) {
    stepsBack($("#get"), apPin);
    const ease = (t: number) => t * t * (3 - 2 * t);
    parts.push({
      read() {
        const r = apTrack.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        /* each app holds for a part of its stretch, then the deck deals the next over the rest; the last one holds
           too (AP_REST of a stretch), so it stands whole on its own ground before the part moves on */
        const seg = Math.min(M - 1, p * (M - 1 + AP_REST));
        const i = Math.min(M - 2, Math.floor(seg));
        AP.pos = M > 1 ? i + ease(clamp((seg - i - 0.38) / 0.62)) : 0;
      },
      write() {
        const key = AP.pos.toFixed(4);
        if (key !== AP.key) {
          AP.key = key;
          if (!AP.w) apMeasure();
          deal(reduce ? Math.round(AP.pos) : AP.pos);
        }
        apTo(Math.round(AP.pos));
        return false;
      },
    });
    const toApp = (i: number) => {
      const r = apTrack.getBoundingClientRect();
      const p = M > 1 ? (i + 0.1) / (M - 1 + AP_REST) : 0;
      scrollTo({ top: scrollY + r.top + clamp(p) * (r.height - innerHeight), behavior: reduce ? "auto" : "smooth" });
    };
    AD.forEach((li, i) => {
      on(li, "click", () => toApp(i));
      on(li, "keydown", byKey);
    });
    /* a tap on the card in front deals the next one */
    apCards.forEach((c) => on(c, "click", () => toApp(Math.min(M - 1, AP.cur + 1))));
    watch((es) => es.forEach((e) => {
      if (e.isIntersecting) ap.classList.add("in");
    }), { threshold: 0.3 }).observe(apPin);
    on(window, "resize", apMeasure);
  }

  /* ---------- 6. the end: the phone on a dark stage under one white light, celebrating your news ---------- */
  const lt = $("#get");
  const ltRoom = $("#ltRoom");
  const ltStage = $("#ltStage");
  const ltAim = $("#ltAim");
  const ltScr = $("#ltScr");
  /* With a mouse it drifts a little toward your pointer, in flat moves only, so its screen stays sharp; at rest it sits
     on whole screen pixels, where text is crispest. On its own it floats (home.css ltfloat). */
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
    /* its film (their big news, celebrated) is fetched while you are in the part before, and plays from its beginning every time you arrive */
    if (ap) watch((es) => {
      if (es[0].isIntersecting) quiet(() => warm(ltScr));
    }).observe(ap);
    watch((es) => es.forEach((e) => {
      if (e.isIntersecting) playScene(ltScr);
      else holdScene(ltScr);
    }), { threshold: 0.5 }).observe(ltStage);
    watch((es) => es.forEach((e) => lt.classList.toggle("in", e.isIntersecting)), { threshold: 0.35 }).observe(ltRoom);
  }

  /* ---------- the foot: the name as big as the page; its letters lean up toward your pointer, or jump when tapped ---------- */
  const ft = $("#ft");
  const giant = $("#ftGiant");
  const gRow = giant ? $(".ftg-row", giant) : null;
  /* A2's units, so the springs feel the same: a letter's box is 320 tall */
  const FONT = 400;
  const GH = FONT * 0.8;
  type L = { g: HTMLElement; cx: number; w: number; y: number; v: number; s: number; vs: number; hold: boolean };
  const letters: L[] = giant ? $$<HTMLElement>(".ftl", giant).map((g) => ({ g, cx: 0, w: 1, y: 0, v: 0, s: 1, vs: 0, hold: false })) : [];
  /* each letter's middle and width across the row, in px, measured: the letters are the font's own, and they change
     size with the page (a transform never moves offsetLeft, so the springs do not disturb it) */
  const measureGiant = () =>
    letters.forEach((L) => {
      L.cx = L.g.offsetLeft + L.g.offsetWidth / 2;
      L.w = Math.max(1, L.g.offsetWidth);
    });
  if (letters.length) {
    measureGiant();
    on(window, "resize", measureGiant);
    if (document.fonts) document.fonts.ready.then(measureGiant).catch(() => {});
  }
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
        const g = (gRow ?? giant).getBoundingClientRect();
        FT.px = pe.clientY > g.top - g.height * 0.3 && pe.clientY < g.bottom + 20 ? pe.clientX - g.left : null;
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
  const NAV = { dark: false, small: false, cur: null as HTMLElement | null, tint: "", tintWas: null as string | null };
  paintHooks.push(() => {
    NAV.tintWas = null;
    kick();
  });
  const darkTops = $$("[data-mode='dark']");
  /* each link of the top bar, and the part of the page it stands for */
  const NAVS = capA.map((a) => ({ a, part: a.dataset.go ? document.getElementById(a.dataset.go) : null })).filter((n) => n.part);
  parts.push({
    read() {
      const vh = innerHeight;
      NAV.small = scrollY > 30;
      /* dark while a night part is under the bar */
      NAV.dark = darkTops.some((d) => {
        const r = d.getBoundingClientRect();
        return r.top < 40 && r.bottom > 40;
      });
      NAV.cur = null;
      for (const n of NAVS) {
        const r = n.part!.getBoundingClientRect();
        if (r.top < vh * 0.5 && r.bottom > vh * 0.5) NAV.cur = n.a;
      }
      /* what the page is under the middle of the screen: the apps' part on the ground of the app in front, a night
         part, or the light page */
      NAV.tint = "";
      const mid = vh * 0.5;
      if (ap) {
        const r = ap.getBoundingClientRect();
        if (r.top < mid && r.bottom > mid) NAV.tint = `app${Math.max(0, AP.cur)}`;
      }
      if (!NAV.tint)
        for (const d of darkTops) {
          const r = d.getBoundingClientRect();
          if (r.top < mid && r.bottom > mid) NAV.tint = "night";
        }
    },
    write() {
      if (cap) {
        cap.classList.toggle("dark", NAV.dark);
        cap.classList.toggle("small", NAV.small);
      }
      /* Whatever shows past the page's edges takes the colour of the part you are in (an iPhone's bars take the page's
         own colour): night over a night part, an app's ground over the apps, the light page elsewhere. Changing it
         redraws the whole screen, so it waits for a pause in your scrolling. */
      if (NAV.tint !== NAV.tintWas) {
        const tint = (NAV.tintWas = NAV.tint);
        quiet(() => {
          if (NAV.tint !== tint) return;
          const from = tint.startsWith("app") ? (apTones[Number(tint.slice(3))] ?? ap) : tint === "night" ? (fr ?? lt ?? ft) : null;
          const colour = from ? getComputedStyle(from).backgroundColor : "";
          de.style.backgroundColor = colour;
          const m = tintMeta();
          if (m) m.content = colour || getComputedStyle(de).getPropertyValue("--bg2").trim();
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
    const part = a.dataset.go ? document.getElementById(a.dataset.go) : null;
    if (!part) return;
    me.preventDefault();
    /* a part that slides up over the one before starts a little under its own top edge */
    scrollTo({ top: scrollY + part.getBoundingClientRect().top + (part.classList.contains("sheet") ? 2 : 0), behavior: reduce ? "auto" : "smooth" });
  });

  /* ---------- set it all up ---------- */
  measure2();
  apMeasure();
  const settle = () => {
    if (!alive) return;
    layout(true);
    measure2();
    apMeasure();
    sayCur = -1;
    if (cur2 >= 1) tabTo(cur2);
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
