"use client";

/**
 * A Together post on its link (krovvi.com/e/<token>; catch8 docs/TOGETHER-2026-11-01.md, piece 8): what a friend
 * lands on from iMessage, WhatsApp or an Instagram DM. The post big and first (an episode's four panels, two Krovvis
 * talking, a plan, a character), the cast as their characters, reactions with who reacted (names, never a big number
 * on its own), comments, and Make yours: what Krovvi is in one line, Get Krovvi, and Open in Krovvi on an iPhone.
 *
 * The site's server reads the post once, for the link preview and so the page paints at once (./page.tsx in
 * src/app/e/[token]); the browser then reads it again with its visitor id, which fills in this person's own reaction
 * and answer, and again every few seconds while a talk is still going. Reacting, commenting and answering need only a
 * first name, asked the first time and kept in this browser; each one shows at once and is put back as it was if it
 * did not go through. An open is counted once the page has really been seen for five seconds.
 *
 * The page speaks the post's language (an Arabic post gets the whole page in Arabic, right to left), and every name
 * and line reads in its own direction.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Face, INK, STEP, EASE } from "@/components/objects/kit";
import { browserLang, say, type Lang, type Words } from "@/lib/objects";
import {
  agoWords,
  appPostUrl,
  cleanName,
  keepName,
  keptName,
  LIMITS,
  namesWords,
  offeredName,
  readPost,
  REACTIONS,
  sayOpened,
  sendAnswer,
  sendComment,
  sendReaction,
  sendReport,
  visitorId,
  withAnswer,
  withComment,
  withReaction,
  type PlanState,
  type PostRead,
  type Reaction,
  type WebPostView,
  type Who,
  type Wrote,
} from "@/lib/together";
import { CharacterPic, OffPage, ReactionIcon, REACTION_WORDS, Shell, Waiting, WaysOn, useIos } from "./bits";
import { CharacterBody, EpisodeBody } from "./picture";
import { PlanBody } from "./plan";
import { TalkBody } from "./talk";

const C = {
  episodeNo: { en: "Episode {n}", ar: "الحلقة {n}" },
  talking: { en: "Two Krovvis talking", ar: "اتنين كروفي بيتكلموا" },
  live: { en: "Talking now", ar: "بيتكلموا دلوقتي" },
  asks: { en: "{name} asks", ar: "سؤال من {name}" },
  characterOf: { en: "{name}’s character", ar: "شخصية {name}" },
  from: { en: "From {name}", ar: "من {name}" },
  krovvis: { en: "{a}’s Krovvi and {b}’s Krovvi", ar: "كروفي {a} وكروفي {b}" },
  inThis: { en: "In this episode", ar: "في الحلقة دي" },
  whoTalks: { en: "Who’s talking", ar: "مين بيتكلم" },
  more: { en: "and {n} more", ar: "و{n} كمان" },
  comments: { en: "Comments", ar: "التعليقات" },
  earlier: { en: "Show earlier comments", ar: "اعرض التعليقات الأقدم" },
  noComments: { en: "No comments yet.", ar: "لسه مفيش تعليقات." },
  comment: { en: "Add a comment", ar: "اكتب تعليق" },
  send: { en: "Send", ar: "ابعت" },
  as: { en: "As {name}.", ar: "باسم {name}." },
  change: { en: "Change", ar: "غيّر" },
  nameTitle: { en: "What’s your first name?", ar: "اسمك الأول إيه؟" },
  nameLine: { en: "So {name} knows who it was. This browser keeps it.", ar: "اسمك هيظهر لـ{name}. المتصفح ده هيفتكره." },
  nameLineNobody: { en: "So they know who it was. This browser keeps it.", ar: "اسمك هيظهر جنب اللي تكتبه. المتصفح ده هيفتكره." },
  namePlaceholder: { en: "Your first name", ar: "اسمك الأول" },
  notNow: { en: "Not now", ar: "مش دلوقتي" },
  done: { en: "Done", ar: "تمام" },
  failed: { en: "That didn’t go through. Try again.", ar: "ماوصلش. جرب تاني." },
  name: { en: "That name can’t be used. Try just your first name.", ar: "الاسم ده مينفعش. اكتب اسمك الأول بس." },
  text: { en: "That comment can’t go up. Links aren’t allowed here.", ar: "التعليق ده مينفعش يتنشر. الروابط مش مسموحة هنا." },
  settled: { en: "This plan is set already.", ar: "الخطة دي اتظبطت خلاص." },
  full: { en: "This plan has all the answers it can take.", ar: "الخطة دي خدت كل الردود اللي تقدر عليها." },
  nameHint: { en: "Just a first name, with no @ or links.", ar: "اسم أول بس، من غير @ أو روابط." },
  reportAsk: { en: "Report this page to Krovvi?", ar: "تبلّغ كروفي عن الصفحة دي؟" },
  reportYes: { en: "Report", ar: "بلّغ" },
  reportNo: { en: "Cancel", ar: "إلغاء" },
  busy: { en: "Too many at once. Try again in a minute.", ar: "كتير مرة واحدة. جرب كمان دقيقة." },
  makeYours: { en: "Make yours", ar: "اعمل بتاعك" },
  report: { en: "Report this page", ar: "بلّغ عن الصفحة دي" },
  reported: { en: "Thanks. It was reported.", ar: "شكرا. البلاغ اتسجل." },
} satisfies Record<string, Words>;

/** What Krovvi is, in one line, said for the kind of thing they just saw. */
const PITCH: Record<WebPostView["kind"], Words> = {
  episode: {
    en: "Krovvi is an AI friend on iPhone. Tell it one line and it makes an episode like this one, starring you and your friends.",
    ar: "كروفي صاحب بالذكاء الاصطناعي على الآيفون. قوله جملة واحدة ويعمل حلقة زي دي، أبطالها إنت وصحابك.",
  },
  character: {
    en: "Krovvi is an AI friend on iPhone. Tell it a little about you and it draws your own character.",
    ar: "كروفي صاحب بالذكاء الاصطناعي على الآيفون. احكيله شوية عنك ويرسم شخصيتك.",
  },
  talk: {
    en: "Krovvi is an AI friend on iPhone. Yours can talk with your friends’ Krovvis, like these two.",
    ar: "كروفي صاحب بالذكاء الاصطناعي على الآيفون. كروفي بتاعك يقدر يتكلم مع كروفي صحابك، زي الاتنين دول.",
  },
  plan: {
    en: "Krovvi is an AI friend on iPhone. It makes plans with your friends, so nobody has to chase anyone.",
    ar: "كروفي صاحب بالذكاء الاصطناعي على الآيفون. بيظبط الخطط مع صحابك، من غير ما حد يجري ورا حد.",
  },
};

/** Comments shown before "Show earlier comments". */
const SHOWN_COMMENTS = 20;

type View = { kind: "loading" } | { kind: "ready"; post: WebPostView } | { kind: "off" } | { kind: "offline" };

/**
 * A dev fixture (src/app/e/dev): no network at all. Writes take half a second and go through, or with `fail` come back
 * refused so the rollback can be seen; `more` are a live talk's next lines, one every few seconds, then it ends.
 */
export interface PostFixture {
  fail?: boolean;
  more?: { side: "a" | "b"; text: string }[];
}

const line = (words: Words, lang: Lang, fill: Record<string, string>) => Object.entries(fill).reduce((s, [k, v]) => s.replace(`{${k}}`, v), say(words, lang));

export function PostPage({ token, first, ios: iosGuess, shellLang = "en", fixture }: { token: string; first: PostRead; ios: boolean; shellLang?: Lang; fixture?: PostFixture }) {
  const [view, setView] = useState<View>(first.ok ? { kind: "ready", post: first.post } : "off" in first ? { kind: "off" } : { kind: "loading" });
  const [langGuess, setLangGuess] = useState<Lang>(shellLang);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState<{ initial: string } | null>(null);
  const [problem, setProblem] = useState<"failed" | "busy" | "name" | "text" | "settled" | "full" | null>(null);
  const [now, setNow] = useState(0);
  const ios = useIos(iosGuess);
  const latest = useRef<WebPostView | null>(first.ok ? first.post : null);
  const writing = useRef(0);
  const answerName = useRef<((n: string | null) => void) | null>(null);

  useEffect(() => {
    if (view.kind === "ready") latest.current = view.post;
  }, [view]);

  useEffect(() => {
    setName(keptName());
    setLangGuess((l) => (first.ok ? l : browserLang()));
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [first.ok]);

  /** Read again as this browser (its own reaction and answer come with it), unless a write is on its way. */
  const refresh = useCallback(async () => {
    if (fixture) return;
    const read = await readPost(token, { visitor: visitorId() });
    if (writing.current > 0) return;
    if (read.ok) setView({ kind: "ready", post: read.post });
    else if ("off" in read) setView({ kind: "off" });
    else setView((v) => (v.kind === "ready" ? v : { kind: "offline" }));
  }, [token, fixture]);

  useEffect(() => {
    if (first.ok || !("off" in first)) void refresh();
  }, [refresh, first]);

  // A live talk is read again every three seconds while the page is in front, until it is done.
  const live = view.kind === "ready" && view.post.kind === "talk" && !!view.post.talk && !view.post.talk.done;
  useEffect(() => {
    if (!live || fixture) return;
    const id = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 3_000);
    return () => window.clearInterval(id);
  }, [live, refresh, fixture]);

  // The fixture's live talk: its next lines arrive one by one, then it ends.
  useEffect(() => {
    if (!fixture?.more?.length || !live) return;
    let i = 0;
    const id = window.setInterval(() => {
      const p = latest.current;
      if (!p?.talk) return;
      const next = fixture.more![i];
      i += 1;
      setView({ kind: "ready", post: { ...p, talk: { ...p.talk, lines: next ? [...p.talk.lines, next] : p.talk.lines, done: !next } } });
      if (!next) window.clearInterval(id);
    }, 3_200);
    return () => window.clearInterval(id);
  }, [fixture, live]);

  // An open counts after five seconds in view, once.
  const counted = useRef(false);
  const ready = view.kind === "ready";
  useEffect(() => {
    if (fixture || !ready || counted.current) return;
    let timer: number | null = null;
    const arm = () => {
      if (timer !== null || document.visibilityState !== "visible") return;
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible" && !counted.current) {
          counted.current = true;
          sayOpened(token, visitorId());
        }
      }, 5_000);
    };
    const away = () => {
      if (document.visibilityState !== "visible" && timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      } else arm();
    };
    arm();
    document.addEventListener("visibilitychange", away);
    return () => {
      document.removeEventListener("visibilitychange", away);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [token, ready, fixture]);

  /** The first name, asked once: the sheet opens and the write waits for it. */
  const askName = useCallback((initial: string) => new Promise<string | null>((resolve) => {
    answerName.current = resolve;
    setSheet({ initial });
  }), []);
  const closeSheet = (given: string | null) => {
    setSheet(null);
    const resolve = answerName.current;
    answerName.current = null;
    resolve?.(given);
  };

  /**
   * A write: drawn at once on the page's own copy, then the server's post when it answers, or the copy from before
   * put back (with a short line why) when it did not go through.
   */
  const act = useCallback(
    async (apply: (post: WebPostView, who: string) => WebPostView, send: (who: Who) => Promise<Wrote>): Promise<boolean> => {
      let who = name || keptName();
      if (!who) {
        const given = await askName(offeredName());
        if (!given) return false;
        keepName(given);
        setName(given);
        who = given;
      }
      const before = latest.current;
      if (!before) return false;
      setProblem(null);
      writing.current += 1;
      const drawn = apply(before, who);
      latest.current = drawn;
      setView({ kind: "ready", post: drawn });
      const result: Wrote = fixture
        ? await new Promise((r) => window.setTimeout(() => r(fixture.fail ? { ok: false, why: "failed" } : { ok: true, post: drawn }), 600))
        : await send({ visitor: visitorId(), name: who });
      writing.current -= 1;
      if (result.ok) {
        latest.current = result.post;
        setView({ kind: "ready", post: result.post });
        return true;
      }
      if (result.why === "off") {
        setView({ kind: "off" });
        return false;
      }
      latest.current = before;
      setView({ kind: "ready", post: before });
      // A name the server will not take is forgotten here too, so the next tap asks for another one.
      if (result.why === "name") {
        keepName("");
        setName("");
      }
      // A plan settled meanwhile: show it as it now stands.
      if (result.why === "settled") void refresh();
      setProblem(result.why);
      return false;
    },
    [name, askName, fixture, refresh]
  );

  if (view.kind === "off") return <OffPage lang={langGuess} />;
  if (view.kind === "offline") return <OffPage lang={langGuess} offline onAgain={() => void refresh()} />;
  if (view.kind === "loading") return <Waiting lang={langGuess} />;

  const post = view.post;
  const lang = post.lang;
  const author = post.authorName;

  const react = (kind: Reaction | null) => void act((p, who) => withReaction(p, kind, who), (who) => sendReaction(token, kind, who));
  const answer = (state: PlanState, picks: string[]) => act((p, who) => withAnswer(p, who, state, picks), (who) => sendAnswer(token, state, picks, who));
  const comment = (text: string) => act((p, who) => withComment(p, who, text, Date.now()), (who) => sendComment(token, text, who));

  return (
    <Shell lang={lang} get>
      <Header post={post} lang={lang} live={live} />

      <div className="mt-5">
        {post.kind === "episode" ? <EpisodeBody post={post} lang={lang} /> : null}
        {post.kind === "character" ? <CharacterBody post={post} lang={lang} /> : null}
        {post.kind === "talk" && post.talk ? <TalkBody post={post} lang={lang} token={token} /> : null}
        {post.kind === "plan" && post.plan ? <PlanBody post={post} lang={lang} onAnswer={answer} /> : null}
      </div>

      {(post.kind === "episode" || post.kind === "talk") && post.cast.length ? <Cast post={post} lang={lang} /> : null}

      <Reactions post={post} lang={lang} onReact={react} />

      {problem ? (
        <p className="mt-3" role="alert" style={{ ...STEP.meta, color: INK.down }}>
          {say(C[problem], lang)}
        </p>
      ) : null}

      <Comments post={post} lang={lang} now={now} name={name} onComment={comment} onChangeName={async () => {
        const given = await askName(name || offeredName());
        if (given) {
          keepName(given);
          setName(given);
        }
      }} />

      <section className="mt-12" style={{ borderTop: `0.5px solid ${INK.line}`, paddingTop: 28 }}>
        <h2 style={{ fontSize: 24, lineHeight: "30px", fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "-0.6px" }}>{say(C.makeYours, lang)}</h2>
        <p className="mt-2" style={{ ...STEP.body, fontSize: 16, lineHeight: "23px", color: INK.soft }}>{say(PITCH[post.kind], lang)}</p>
        <div className="mt-5">
          <WaysOn lang={lang} deep={appPostUrl(token)} ios={ios} lead="get" />
        </div>
      </section>

      <Report token={token} lang={lang} fixture={!!fixture} />

      {sheet ? <NameSheet lang={lang} author={author} initial={sheet.initial} onDone={closeSheet} /> : null}
      <style>{`@keyframes tg-bump{0%{transform:scale(1)}40%{transform:scale(1.22)}100%{transform:scale(1)}}@keyframes tg-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes tg-breathe{0%,100%{opacity:.35}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.tg-anim{animation:none!important}}`}</style>
    </Shell>
  );
}

/* ── The top: what it is, and whose ────────────────────────────────────── */

function Header({ post, lang, live }: { post: WebPostView; lang: Lang; live: boolean }) {
  const author = post.authorName;
  let kicker: ReactNode = null;
  let title = post.title;
  let by: string | null = null;
  if (post.kind === "episode") {
    const ep = post.episode;
    const no = line(C.episodeNo, lang, { n: String(ep?.episodeNo ?? 1) });
    kicker = ep?.showTitle ? (
      <>
        <bdi dir="auto">{ep.showTitle}</bdi>
        {" · "}
        {no}
      </>
    ) : (
      no
    );
    by = author ? line(C.from, lang, { name: author }) : null;
  } else if (post.kind === "talk") {
    kicker = (
      <span className="inline-flex items-center" style={{ gap: 8 }}>
        {say(C.talking, lang)}
        {live ? (
          <span className="inline-flex items-center" style={{ gap: 6, color: INK.fg }}>
            <span className="tg-anim" aria-hidden style={{ width: 6, height: 6, borderRadius: 3, background: INK.up, animation: "tg-breathe 1800ms ease-in-out infinite" }} />
            {say(C.live, lang)}
          </span>
        ) : null}
      </span>
    );
    title = post.talk?.topic || post.title;
    by = post.talk?.a && post.talk?.b ? line(C.krovvis, lang, { a: post.talk.a, b: post.talk.b }) : null;
  } else if (post.kind === "plan") {
    kicker = author ? <bdi>{line(C.asks, lang, { name: author })}</bdi> : null;
    title = post.plan?.what || post.title;
  } else {
    kicker = author ? <bdi>{line(C.characterOf, lang, { name: author })}</bdi> : null;
    title = post.character?.name || post.cast[0]?.character?.name || post.title;
  }
  return (
    <header className="mt-6">
      {kicker ? (
        <p style={{ ...STEP.label, fontSize: 12, fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "0.12em", textTransform: "uppercase", color: INK.muted }}>{kicker}</p>
      ) : null}
      <h1 className="mt-2" style={{ fontSize: 28, lineHeight: "34px", fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "-0.8px", textAlign: "start" }}>
        <bdi dir="auto">{title}</bdi>
      </h1>
      {by ? <p className="mt-1" style={{ ...STEP.body, color: INK.muted }}>{by}</p> : null}
    </header>
  );
}

/* ── The cast ──────────────────────────────────────────────────────────── */

function Cast({ post, lang }: { post: WebPostView; lang: Lang }) {
  return (
    <section className="mt-8">
      <h2 style={{ ...STEP.label, color: INK.muted }}>{say(post.kind === "talk" ? C.whoTalks : C.inThis, lang)}</h2>
      <ul className="mt-2" style={{ background: INK.surface, borderRadius: 17 }}>
        {post.cast.map((m, i) => (
          <li key={`${m.name}-${i}`}>
            {i ? <div style={{ height: 0.5, background: INK.line, marginInlineStart: 80 }} /> : null}
            <div className="flex items-center" style={{ gap: 14, padding: "12px 16px", minHeight: 76 }}>
              <CharacterPic character={m.character} name={m.name} size={52} radius={14} />
              <span className="min-w-0 flex-1">
                <span className="block" style={{ ...STEP.title, fontSize: 16, textAlign: "start" }}>
                  <bdi dir="auto">{m.character?.name ?? m.name}</bdi>
                </span>
                <span className="block" style={{ ...STEP.meta, fontSize: 13, lineHeight: "18px", color: INK.muted, textAlign: "start" }}>
                  {m.character ? (
                    <>
                      <bdi dir="auto" style={{ color: INK.soft }}>{m.name}</bdi>
                      {m.character.lore ? (
                        <>
                          {" · "}
                          <bdi dir="auto">{m.character.lore}</bdi>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Reactions ─────────────────────────────────────────────────────────── */

function Reactions({ post, lang, onReact }: { post: WebPostView; lang: Lang; onReact: (kind: Reaction | null) => void }) {
  // Who reacted, by reaction, in the order they first appear (newest first, as the server sends them).
  const byKind = new Map<Reaction, string[]>();
  for (const r of post.reactions) byKind.set(r.kind, [...(byKind.get(r.kind) ?? []), r.name]);
  const others = Math.max(0, post.counts.reactions - post.reactions.length);
  return (
    <section className="mt-8">
      <div className="grid grid-cols-4" style={{ gap: 8 }}>
        {REACTIONS.map((kind) => {
          const on = post.mine.reaction === kind;
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={on}
              onClick={() => onReact(on ? null : kind)}
              className="flex flex-col items-center justify-center rounded-[16px] transition-[transform,background-color,color] duration-200 active:scale-[0.96]"
              style={{ height: 66, gap: 5, background: on ? INK.fg : INK.surfaceHi, color: on ? INK.bg : INK.fg }}
            >
              <span key={on ? "on" : "off"} className="tg-anim" style={{ animation: on ? `tg-bump 360ms ${EASE}` : undefined }}>
                <ReactionIcon kind={kind} size={24} />
              </span>
              <span style={{ ...STEP.meta, fontWeight: 600 }}>{say(REACTION_WORDS[kind], lang)}</span>
            </button>
          );
        })}
      </div>
      {byKind.size ? (
        <div className="mt-3 flex flex-wrap items-center" style={{ gap: "6px 16px" }} aria-live="polite">
          {[...byKind.entries()].map(([kind, names]) => (
            <span key={kind} className="inline-flex min-w-0 items-center" style={{ gap: 6, color: INK.soft }}>
              <ReactionIcon kind={kind} size={15} color={INK.muted} weight={2} />
              <span style={{ ...STEP.label, fontWeight: 400 }}>
                {names.length > 3 ? `${namesWords(names.slice(0, 3), lang)} +${names.length - 3}` : namesWords(names, lang)}
              </span>
            </span>
          ))}
          {others ? <span style={{ ...STEP.label, fontWeight: 400, color: INK.muted }}>{line(C.more, lang, { n: String(others) })}</span> : null}
        </div>
      ) : null}
    </section>
  );
}

/* ── Comments ──────────────────────────────────────────────────────────── */

function Comments({ post, lang, now, name, onComment, onChangeName }: { post: WebPostView; lang: Lang; now: number; name: string; onComment: (text: string) => Promise<boolean>; onChangeName: () => void }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const list = [...post.comments].sort((a, b) => a.at - b.at);
  const hidden = all ? 0 : Math.max(0, list.length - SHOWN_COMMENTS);
  const shown = list.slice(hidden);
  const text = draft.replace(/\s+$/g, "").replace(/^\s+/g, "");

  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(120, el.scrollHeight)}px`;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text || sending) return;
    setSending(text);
    setDraft("");
    requestAnimationFrame(grow);
    const ok = await onComment(text);
    setSending(null);
    // Not sent: the words go back in the field, so nothing typed is lost.
    if (!ok) {
      setDraft(text);
      requestAnimationFrame(grow);
    }
  };

  return (
    <section className="mt-10">
      <h2 style={{ ...STEP.label, color: INK.muted }}>{say(C.comments, lang)}</h2>
      {hidden ? (
        <button type="button" onClick={() => setAll(true)} className="mt-3" style={{ ...STEP.label, color: INK.soft }}>
          {say(C.earlier, lang)}
        </button>
      ) : null}
      {shown.length ? (
        <ul className="mt-2">
          {shown.map((c, i) => {
            const pending = sending !== null && i === shown.length - 1 && c.text === sending && c.name === name;
            return (
              <li key={`${c.at}-${i}`} className="flex" style={{ gap: 10, padding: "10px 0", opacity: pending ? 0.55 : 1, transition: `opacity 200ms ${EASE}` }}>
                <Face name={c.name} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline" style={{ gap: 8 }}>
                    <span className="truncate" style={{ ...STEP.label, fontWeight: 600 }}>
                      <bdi dir="auto">{c.name}</bdi>
                    </span>
                    <span className="shrink-0" style={{ ...STEP.meta, color: INK.faint }}>{agoWords(c.at, now, lang)}</span>
                  </p>
                  {/* As the site's rows do: the line stands with the page (under the name), and reads in its own direction. */}
                  <p style={{ ...STEP.body, textAlign: "start", whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 1 }}>
                    <bdi dir="auto">{c.text}</bdi>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>{say(C.noComments, lang)}</p>
      )}
      <form onSubmit={submit} className="mt-3 flex items-end" style={{ gap: 8 }}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">{say(C.comment, lang)}</span>
          <textarea
            ref={field}
            value={draft}
            rows={1}
            maxLength={LIMITS.commentMax}
            onChange={(e) => {
              setDraft(e.target.value.slice(0, LIMITS.commentMax));
              grow();
            }}
            onKeyDown={(e) => {
              // Enter sends on a computer; on a phone the keyboard's own return makes a new line.
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                void submit(e);
              }
            }}
            placeholder={say(C.comment, lang)}
            dir="auto"
            className="block w-full resize-none rounded-[14px] outline-none placeholder:text-[#7A7A74]"
            // 16px: iOS Safari zooms the page into any field set smaller.
            style={{ ...STEP.body, fontSize: 16, lineHeight: "22px", padding: "11px 14px", background: "rgba(255,255,255,0.06)", color: INK.fg, minHeight: 44, maxHeight: 120 }}
          />
        </label>
        <button
          type="submit"
          disabled={!text || !!sending}
          aria-label={say(C.send, lang)}
          className="flex shrink-0 items-center justify-center rounded-full transition-[transform,opacity] duration-200 active:scale-[0.94]"
          style={{ width: 44, height: 44, background: INK.fg, color: INK.bg, opacity: text && !sending ? 1 : 0.35 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
          </svg>
        </button>
      </form>
      {name ? (
        <p className="mt-2" style={{ ...STEP.meta, color: INK.muted }}>
          <bdi>{line(C.as, lang, { name })}</bdi>{" "}
          <button type="button" onClick={onChangeName} className="underline decoration-dotted underline-offset-2" style={{ color: INK.soft }}>
            {say(C.change, lang)}
          </button>
        </p>
      ) : null}
    </section>
  );
}

/* ── The first name, once ──────────────────────────────────────────────── */

function NameSheet({ lang, author, initial, onDone }: { lang: Lang; author: string; initial: string; onDone: (name: string | null) => void }) {
  const [value, setValue] = useState(initial);
  const field = useRef<HTMLInputElement>(null);
  const clean = cleanName(value);
  useEffect(() => {
    field.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onDone(null);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="tg-name-title" dir={lang === "ar" ? "rtl" : "ltr"}>
      <button type="button" className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => onDone(null)} aria-label={say(C.notNow, lang)} />
      <form
        className="relative w-full max-w-[600px]"
        style={{ background: INK.surface, borderRadius: "22px 22px 0 0", padding: "22px 16px max(24px, env(safe-area-inset-bottom))", animation: `tg-in 260ms ${EASE} both` }}
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) onDone(clean);
        }}
      >
        <h2 id="tg-name-title" style={{ ...STEP.title, fontSize: 20, lineHeight: "26px" }}>{say(C.nameTitle, lang)}</h2>
        <p className="mb-4 mt-1" style={{ ...STEP.body, color: INK.muted }}>
          <bdi>{author ? line(C.nameLine, lang, { name: author }) : say(C.nameLineNobody, lang)}</bdi>
        </p>
        <input
          ref={field}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 30))}
          placeholder={say(C.namePlaceholder, lang)}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="done"
          maxLength={30}
          dir="auto"
          className="w-full rounded-[14px] outline-none placeholder:text-[#7A7A74]"
          style={{ ...STEP.body, fontSize: 16, padding: "14px 16px", background: INK.surfaceHi, color: INK.fg }}
        />
        {value.trim() && !clean ? (
          <p className="mt-2" role="status" style={{ ...STEP.meta, color: INK.muted }}>
            {say(C.nameHint, lang)}
          </p>
        ) : null}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => onDone(null)} className="h-[50px] flex-1 rounded-full" style={{ ...STEP.body, fontWeight: 600, background: INK.surfaceHi, color: INK.fg }}>
            {say(C.notNow, lang)}
          </button>
          <button type="submit" disabled={!clean} className="h-[50px] flex-1 rounded-full transition-opacity disabled:opacity-40" style={{ ...STEP.body, fontWeight: 600, background: INK.fg, color: INK.bg }}>
            {say(C.done, lang)}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Report ────────────────────────────────────────────────────────────── */

/** Report, asked once before it goes (one tap used to file it), and said plainly when it did not go through. */
function Report({ token, lang, fixture }: { token: string; lang: Lang; fixture: boolean }) {
  const [step, setStep] = useState<"idle" | "ask" | "sending" | "done" | "failed">("idle");
  const quiet = { ...STEP.meta, color: INK.faint, minHeight: 32 };
  const send = async () => {
    setStep("sending");
    setStep(fixture || (await sendReport(token, "reported from the page", visitorId())) ? "done" : "failed");
  };
  return (
    <footer className="mt-12 text-center">
      {step === "done" ? (
        <span role="status" style={{ ...STEP.meta, color: INK.faint }}>{say(C.reported, lang)}</span>
      ) : step === "ask" || step === "sending" || step === "failed" ? (
        <div role="group" aria-label={say(C.reportAsk, lang)} className="flex flex-col items-center gap-2">
          <span style={{ ...STEP.meta, color: INK.muted }}>{say(step === "failed" ? C.failed : C.reportAsk, lang)}</span>
          <div className="flex gap-5">
            <button type="button" className="underline decoration-dotted underline-offset-4" style={quiet} onClick={() => setStep("idle")}>
              {say(C.reportNo, lang)}
            </button>
            <button type="button" disabled={step === "sending"} className="underline decoration-dotted underline-offset-4 disabled:opacity-50" style={{ ...quiet, color: INK.soft }} onClick={() => void send()}>
              {say(C.reportYes, lang)}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="underline decoration-dotted underline-offset-4" style={quiet} onClick={() => setStep("ask")}>
          {say(C.report, lang)}
        </button>
      )}
    </footer>
  );
}
