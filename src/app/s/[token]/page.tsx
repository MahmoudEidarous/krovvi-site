import type { Metadata } from "next";

import { SharePage } from "@/components/share/share-page";
import { SHARE_API } from "@/lib/share";

/**
 * A chat someone shared from Krovvi (krovvi.com/s/<token>): every question
 * and answer, drawn as the app draws them. The chat is read in the browser
 * (components/share/share-page.tsx); here only its title is read, for the
 * card a messaging app draws under the link.
 */

const LINE = "Shared from Krovvi";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "A chat from Krovvi";
  if (/^[A-Za-z0-9_-]{20,40}$/.test(token)) {
    try {
      const res = await fetch(`${SHARE_API}?t=${encodeURIComponent(token)}&meta=1`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const meta = (await res.json()) as { ok?: boolean; title?: string };
      if (meta.ok && meta.title) title = meta.title;
    } catch {
      // The plain name; the page still opens.
    }
  }
  return {
    title,
    description: LINE,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { type: "website", siteName: "Krovvi", title, description: LINE },
    twitter: { card: "summary", title, description: LINE },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharePage token={token} />;
}
