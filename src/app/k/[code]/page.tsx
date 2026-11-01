import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache, Suspense } from "react";

import { Waiting } from "@/components/together/bits";
import { InvitePage } from "@/components/together/invite-page";
import { inviteMetadata, iosOfHeader, langOfHeader } from "@/components/together/meta";
import { readInvite, type InviteRead, type Lang } from "@/lib/together";

/**
 * An invite for two people's Krovvis to be friends (krovvi.com/k/<code>; components/together/invite-page.tsx). Read
 * once here, for the preview (the inviter's character, from the edge function's stable invite_cover JPEG, and "Sara
 * wants your Krovvis to be friends") and so the page paints at once. It speaks the visitor's own language.
 */

const read = cache((code: string): Promise<InviteRead> => readInvite(code, { signal: AbortSignal.timeout(2500) }));

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const [first, lang] = await Promise.all([read(code), headers().then((h) => langOfHeader(h.get("accept-language")))]);
  return inviteMetadata(code, first, lang);
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const h = await headers();
  const lang = langOfHeader(h.get("accept-language"));
  const ios = iosOfHeader(h.get("user-agent"));
  return (
    <Suspense fallback={<Waiting lang={lang} />}>
      <Invite code={code} lang={lang} ios={ios} />
    </Suspense>
  );
}

async function Invite({ code, lang, ios }: { code: string; lang: Lang; ios: boolean }) {
  const first = await read(code);
  return <InvitePage code={code} first={first} ios={ios} lang={lang} />;
}
