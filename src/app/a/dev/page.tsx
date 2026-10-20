import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { FriendAskRead } from "@/lib/friend-ask";
import { AskPage } from "../[token]/ask-page";

/** A dev view: never in a search engine. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

const FIXTURES: Record<string, FriendAskRead> = {
  en: { ok: true, asker: "Mahmoud", question: "Black or green?", options: ["Black", "Green"], lang: "en", closed: false },
  ar: { ok: true, asker: "محمود", question: "أسود ولا أخضر؟", options: ["أسود", "أخضر"], lang: "ar", closed: false },
  four: { ok: true, asker: "Lina", question: "Where on Friday?", options: ["Zamalek", "Maadi", "New Cairo", "Stay home"], lang: "en", closed: false },
  closed: { ok: true, asker: "Mahmoud", question: "Black or green?", options: ["Black", "Green"], lang: "en", closed: true },
};

/** A friend's page with no network, while building: /a/dev?f=en (ar, four, closed). Send pretends it went. Not in a production build. */
export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { f } = await searchParams;
  const fixture = FIXTURES[f ?? "en"] ?? FIXTURES.en;
  return <AskPage token={`dev-${f ?? "en"}-fixture-token`} fixture={fixture} />;
}
