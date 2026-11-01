import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache, Suspense } from "react";

import { Waiting } from "@/components/together/bits";
import { iosOfHeader, langOfHeader, postMetadata } from "@/components/together/meta";
import { PostPage } from "@/components/together/post-page";
import { readPost, type Lang, type PostRead } from "@/lib/together";

/**
 * A Krovvi Together post someone sent (krovvi.com/e/<token>): an episode, two Krovvis talking, a plan or a character,
 * with no app (components/together/post-page.tsx). The post is read here once, for the card a messaging app draws
 * under the link (its own picture, big) and so the page paints at once; React's cache makes that one read serve both.
 * A read never counts as an open (the contract): the page says it was opened only after five seconds in view.
 *
 * Never indexed, never cached, no referrer (next.config.ts); AI crawlers are kept off (robots.ts).
 */

const read = cache((token: string): Promise<PostRead> => readPost(token, { init: { signal: AbortSignal.timeout(2500) } }));

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const [first, lang] = await Promise.all([read(token), headers().then((h) => langOfHeader(h.get("accept-language")))]);
  return postMetadata(token, first, lang);
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const h = await headers();
  const lang = langOfHeader(h.get("accept-language"));
  const ios = iosOfHeader(h.get("user-agent"));
  return (
    <Suspense fallback={<Waiting lang={lang} />}>
      <Post token={token} lang={lang} ios={ios} />
    </Suspense>
  );
}

async function Post({ token, lang, ios }: { token: string; lang: Lang; ios: boolean }) {
  const first = await read(token);
  return <PostPage token={token} first={first} ios={ios} shellLang={lang} />;
}
