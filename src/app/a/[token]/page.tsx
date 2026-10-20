import type { Metadata } from "next";

import { readAsk } from "@/lib/friend-ask";
import { AskPage } from "./ask-page";

/**
 * A question someone's Krovvi made for their friends (krovvi.com/a/<token>): the friend answers with a first name,
 * no app, no sign-up (./ask-page.tsx). Here only the question and the asker's first name are read, for the line a
 * messaging app draws under the link ("Mahmoud asks: Black or green?"); the page itself reads the question in the
 * browser. No picture is made for it: the site's own stands.
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "A question from Krovvi";
  let line = "Answer with just your first name. No app, no sign-up.";
  let lang: "en" | "ar" = "en";
  const read = await readAsk(token, { signal: AbortSignal.timeout(2500) }).catch(() => null);
  if (read?.ok) {
    lang = read.ask.lang;
    const who = read.ask.asker;
    title = lang === "ar" ? (who ? `سؤال من ${who}: ${read.ask.question}` : read.ask.question) : who ? `${who} asks: ${read.ask.question}` : read.ask.question;
    line = lang === "ar" ? "رد باسمك الأول بس. من غير أبلكيشن ولا تسجيل." : line;
  }
  return {
    // Absolute: the question itself, never the site's template around it.
    title: { absolute: title },
    description: line,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { type: "website", siteName: "Krovvi", title, description: line, locale: lang === "ar" ? "ar_EG" : "en_US" },
    twitter: { card: "summary", title, description: line },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AskPage token={token} />;
}
