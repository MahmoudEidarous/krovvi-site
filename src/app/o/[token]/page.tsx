import type { Metadata } from "next";

import { ObjectView } from "@/components/objects/object-view";
import { OBJECTS_API } from "@/lib/objects";

/**
 * A Krovvi object opened from its link (krovvi.com/o/<token>), with no app:
 * a split, a plan, a countdown someone shared. Everything shown is read in
 * the browser (components/objects/object-view.tsx); here only the title is
 * read, for the card a messaging app draws under the link.
 */

/** The one picture every shared link shows in a messaging app (app/opengraph-image.png), never the content. */
const BRAND = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Krovvi" };
const LINE = "Open it to see it and take part. No app needed.";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "Krovvi";
  if (/^[A-Za-z0-9_-]{20,40}$/.test(token)) {
    try {
      const res = await fetch(`${OBJECTS_API}?t=${encodeURIComponent(token)}&meta=1`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const meta = (await res.json()) as { ok?: boolean; title?: string; emoji?: string | null };
      if (meta.ok && meta.title) title = `${meta.emoji ? `${meta.emoji} ` : ""}${meta.title}`;
    } catch {
      // The preview keeps the plain name; the page still opens.
    }
  }
  return {
    title,
    description: LINE,
    robots: { index: false, follow: false, nocache: true },
    // The page's own tags replace the site's, its picture with them: the one Krovvi picture, named again here.
    openGraph: { type: "website", siteName: "Krovvi", title, description: LINE, images: [BRAND] },
    twitter: { card: "summary_large_image", title, description: LINE, images: [BRAND.url] },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ObjectView token={token} />;
}
