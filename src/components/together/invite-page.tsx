"use client";

/**
 * An invite for two people's Krovvis to be friends (krovvi.com/k/<code>; catch8 docs/TOGETHER-2026-11-01.md, piece
 * 1): "Sara wants your Krovvis to be friends" under her character, what that means in two plain lines, then Open in
 * Krovvi (only the app can say yes) and Get Krovvi. An invite that ran out says so and who to ask for a new one; a
 * code that is off or never was gets the calm off page.
 *
 * The invite carries no language of its own, so the page speaks the visitor's (their browser's first language, read
 * on the server so nothing flashes). Arabic lines about the inviter are written so they read right for anyone.
 */

import { useCallback, useEffect, useState } from "react";

import { INK, STEP } from "@/components/objects/kit";
import { say, type Lang, type Words } from "@/lib/objects";
import { JOIN_URL } from "@/lib/site";
import { appJoinUrl, readInvite, type InviteRead, type WebInviteView } from "@/lib/together";
import { CharacterPic, OffPage, Shell, Waiting, WaysOn, useIos } from "./bits";

const C = {
  title: { en: "{name} wants your Krovvis to be friends", ar: "دعوة من {name} عشان الكروفي بتاعكم يبقوا صحاب" },
  one: {
    en: "Your Krovvis can talk with each other, make episodes starring you both, and plan things together.",
    ar: "الكروفي بتاعكم يقدروا يتكلموا مع بعض، ويعملوا حلقات أبطالها إنتو الاتنين، ويظبطوا خطط سوا.",
  },
  two: {
    en: "Each of you picks what your own Krovvi can share, and either of you can stop it at any time.",
    ar: "كل واحد فيكم بيختار الكروفي بتاعه يشارك إيه، وأي حد فيكم يقدر يوقف ده في أي وقت.",
  },
  ranOut: { en: "This invite has run out", ar: "الدعوة دي خلصت" },
  ranOutLine: { en: "Ask {name} to send a new one.", ar: "اطلب من {name} دعوة جديدة." },
  get: { en: "Get Krovvi", ar: "حمّل كروفي" },
} satisfies Record<string, Words>;

type View = { kind: "loading" } | { kind: "ready"; invite: WebInviteView } | { kind: "off" } | { kind: "offline" };

export function InvitePage({ code, first, ios: iosGuess, lang }: { code: string; first: InviteRead; ios: boolean; lang: Lang }) {
  const [view, setView] = useState<View>(first.ok ? { kind: "ready", invite: first.invite } : "off" in first ? { kind: "off" } : { kind: "loading" });
  const ios = useIos(iosGuess);

  const load = useCallback(() => {
    setView({ kind: "loading" });
    void readInvite(code).then((r) => setView(r.ok ? { kind: "ready", invite: r.invite } : "off" in r ? { kind: "off" } : { kind: "offline" }));
  }, [code]);
  // The server could not reach it in time: the browser tries once on its own.
  useEffect(() => {
    if (!first.ok && !("off" in first)) load();
  }, [first, load]);

  if (view.kind === "off") return <OffPage lang={lang} />;
  if (view.kind === "offline") return <OffPage lang={lang} offline onAgain={load} />;
  if (view.kind === "loading") return <Waiting lang={lang} />;

  const invite = view.invite;
  if (!invite.valid) {
    return (
      <Shell lang={lang} width={520}>
        <div className="py-24 text-center">
          <h1 style={{ ...STEP.title, fontSize: 22, lineHeight: "28px" }}>{say(C.ranOut, lang)}</h1>
          <p className="mt-2" style={{ ...STEP.body, color: INK.muted }}>
            <bdi>{say(C.ranOutLine, lang).replace("{name}", invite.name)}</bdi>
          </p>
          <div className="mt-12">
            <a href={JOIN_URL} className="underline decoration-dotted underline-offset-4" style={{ ...STEP.meta, color: INK.faint }}>
              {say(C.get, lang)}
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  const character = invite.character;
  return (
    <Shell lang={lang} width={520}>
      <div className="flex flex-col items-center text-center" style={{ paddingTop: 28 }}>
        <CharacterPic character={character} name={invite.name} size={176} radius={36} priority />
        <h1 className="mt-7" style={{ fontSize: 26, lineHeight: "32px", fontWeight: 600, letterSpacing: lang === "ar" ? 0 : "-0.7px", maxWidth: 420 }}>
          <bdi>{say(C.title, lang).replace("{name}", invite.name)}</bdi>
        </h1>
        {character ? (
          <p className="mt-2" style={{ ...STEP.body, color: INK.muted, maxWidth: 380 }}>
            <bdi dir="auto" style={{ color: INK.soft, fontWeight: 600 }}>{character.name}</bdi>
            {character.lore ? (
              <>
                {" · "}
                <bdi dir="auto">{character.lore}</bdi>
              </>
            ) : null}
          </p>
        ) : null}
        <div className="mt-8 w-full text-start" style={{ background: INK.surface, borderRadius: 17, padding: "6px 16px" }}>
          {[C.one, C.two].map((words, i) => (
            <p key={i} className="flex" style={{ ...STEP.body, fontSize: 16, lineHeight: "23px", color: INK.soft, gap: 12, padding: "12px 0", borderTop: i ? `0.5px solid ${INK.line}` : "none" }}>
              <span aria-hidden className="shrink-0" style={{ ...STEP.label, color: INK.faint, width: 14, paddingTop: 2 }}>{i + 1}</span>
              <span>{say(words, lang)}</span>
            </p>
          ))}
        </div>
        <div className="mt-7 w-full">
          <WaysOn lang={lang} deep={appJoinUrl(code)} ios={ios} lead="open" />
        </div>
      </div>
    </Shell>
  );
}
