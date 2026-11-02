/**
 * What a messaging app shows under a Together link (krovvi.com/e/<token> a post, krovvi.com/k/<code> an invite):
 * the post's own picture big (the edge function's stable ?cover= JPEG, with its real size), a title and one line in
 * the post's language. A link that is off, removed or never was one gets a plain title and no picture at all. Used
 * by the routes and by their dev fixtures, so what is checked while building is what ships.
 *
 * Never indexed, never cached (next.config.ts); iMessage, WhatsApp and Instagram fetch these tags as
 * facebookexternalhit, Twitterbot or WhatsApp, which Next answers with the tags in the head (its htmlLimitedBots).
 */

import type { Metadata } from "next";

import { coverUrl, inviteCoverUrl, inviterName, namesWords, type InviteRead, type Lang, type PostRead, type WebPostView } from "@/lib/together";

const NOINDEX = { index: false, follow: false, nocache: true } as const;

/** The language the visitor's browser asks for first: Arabic or English. */
export function langOfHeader(accept: string | null | undefined): Lang {
  const first = (accept ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ar") ? "ar" : "en";
}

/** An iPhone or iPad by its user agent (an iPad that says it is a Mac is told apart in the browser). */
export function iosOfHeader(agent: string | null | undefined): boolean {
  return /iPhone|iPad|iPod/.test(agent ?? "");
}

const OFF = {
  en: { title: "This link is off", line: "Whoever sent it may have turned it off." },
  ar: { title: "اللينك ده مقفول", line: "يمكن اللي بعته قفله." },
};

const FALLBACK = {
  en: { title: "Krovvi", line: "Open it to see it. No app needed." },
  ar: { title: "كروفي", line: "افتحه عشان تشوفه. من غير أبلكيشن." },
};

function plain(title: string, line: string, lang: Lang): Metadata {
  return {
    title: { absolute: title },
    description: line,
    robots: NOINDEX,
    // An empty list: no picture at all, not even the site's own.
    openGraph: { type: "website", siteName: "Krovvi", title, description: line, locale: lang === "ar" ? "ar_EG" : "en_US", images: [] },
    twitter: { card: "summary", title, description: line, images: [] },
  };
}

/** The post's title and line for a preview, in its own language. */
export function previewWords(post: WebPostView): { title: string; line: string } {
  const ar = post.lang === "ar";
  const author = post.authorName;
  const free = ar ? "من غير أبلكيشن." : "No app needed.";
  if (post.kind === "episode") {
    const ep = post.episode;
    const names = namesWords(post.cast.map((m) => m.name), post.lang);
    const show = ep ? (ar ? `${ep.showTitle ? `${ep.showTitle}، ` : ""}الحلقة ${ep.episodeNo}.` : `${ep.showTitle ? `${ep.showTitle}, episode` : "Episode"} ${ep.episodeNo}.`) : "";
    const starring = names ? (ar ? ` بطولة ${names}.` : ` Starring ${names}.`) : "";
    return { title: post.title || (ar ? "حلقة جديدة" : "A new episode"), line: `${show}${starring} ${free}`.trim() };
  }
  if (post.kind === "talk") {
    const t = post.talk;
    const who = t?.a && t?.b ? (ar ? `كروفي ${t.a} وكروفي ${t.b} بيتكلموا.` : `${t.a}’s Krovvi and ${t.b}’s Krovvi talk it out.`) : ar ? "اتنين كروفي بيتكلموا." : "Two Krovvis talk it out.";
    return { title: t?.topic || post.title, line: `${who} ${ar ? "اتفرج من غير أبلكيشن." : "Watch it, no app needed."}` };
  }
  if (post.kind === "plan") {
    const what = post.plan?.what || post.title;
    return {
      title: author ? (ar ? `سؤال من ${author}: ${what}` : `${author} asks: ${what}`) : what,
      line: ar ? "قول إذا كنت جاي باسمك الأول بس. من غير أبلكيشن." : "Say if you’re in with just your first name. No app needed.",
    };
  }
  const name = post.character?.name || post.cast[0]?.character?.name || post.title;
  const lore = post.character?.lore || post.cast[0]?.character?.lore || "";
  const whose = author ? (ar ? `شخصية ${author} على كروفي.` : `${author}’s character on Krovvi.`) : "";
  return { title: name, line: [lore && (/[.!?؟]$/.test(lore) ? lore : `${lore}.`), whose].filter(Boolean).join(" ") || free };
}

export function postMetadata(token: string, read: PostRead, lang: Lang): Metadata {
  if (!read.ok) return "off" in read ? plain(OFF[lang].title, OFF[lang].line, lang) : plain(FALLBACK[lang].title, FALLBACK[lang].line, lang);
  const post = read.post;
  const { title, line } = previewWords(post);
  // The cover's real size, so a messaging app lays it out before it loads; the stable address, never the signed one.
  const image = post.cover ? { url: coverUrl(token), width: post.cover.w, height: post.cover.h, alt: title, type: "image/jpeg" } : null;
  return {
    // Absolute: the post's own title, never the site's template around it.
    title: { absolute: title },
    description: line,
    robots: NOINDEX,
    openGraph: { type: "website", siteName: "Krovvi", title, description: line, locale: post.lang === "ar" ? "ar_EG" : "en_US", images: image ? [image] : [] },
    twitter: image ? { card: "summary_large_image", title, description: line, images: [{ url: image.url, alt: title }] } : { card: "summary", title, description: line, images: [] },
  };
}

const INVITE = {
  en: { title: "{name} wants your Krovvis to be friends", line: "Open it on your iPhone to say yes." },
  ar: { title: "دعوة من {name} عشان الكروفي بتاعكم يبقوا صحاب", line: "افتحها على الآيفون عشان توافق." },
};

const RAN_OUT = {
  en: { title: "This invite has run out", line: "Ask {name} to send a new one." },
  ar: { title: "الدعوة دي خلصت", line: "اطلب من {name} دعوة جديدة." },
};

export function inviteMetadata(code: string, read: InviteRead, lang: Lang): Metadata {
  if (!read.ok) return plain(OFF[lang].title, OFF[lang].line, lang);
  // An invite that ran out says so, as its page does, and who to ask; still no picture.
  if (!read.invite.valid) return plain(RAN_OUT[lang].title, RAN_OUT[lang].line.replace("{name}", inviterName(read.invite.name, lang, false)), lang);
  const invite = read.invite;
  const title = INVITE[lang].title.replace("{name}", inviterName(invite.name, lang));
  const line = INVITE[lang].line;
  // The inviter's character, from the edge function's stable invite_cover JPEG (its size is the character picture's).
  const pic = invite.character?.image;
  const image = pic ? { url: inviteCoverUrl(code), width: pic.w, height: pic.h, alt: invite.character!.name, type: "image/jpeg" } : null;
  return {
    title: { absolute: title },
    description: line,
    robots: NOINDEX,
    openGraph: { type: "website", siteName: "Krovvi", title, description: line, locale: lang === "ar" ? "ar_EG" : "en_US", images: image ? [image] : [] },
    twitter: image ? { card: "summary_large_image", title, description: line, images: [{ url: image.url, alt: image.alt }] } : { card: "summary", title, description: line, images: [] },
  };
}
