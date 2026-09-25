import type { Metadata } from "next";

import { RecordPage } from "./record-page";

/**
 * What was agreed in a conversation, sent by someone who uses Krovvi to the
 * person they spoke with: confirm it, or fix a line.
 *
 * The lines are loaded in the browser, never here. A messaging app that
 * builds a link preview fetches this page on its own, and a server-side read
 * would tell the sender "they opened it" before anyone had.
 */
export const metadata: Metadata = {
  title: "What we agreed",
  description: "Open to confirm it or fix a line.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Krovvi",
    title: "What we agreed",
    description: "Open to confirm it or fix a line.",
  },
  twitter: { card: "summary", title: "What we agreed", description: "Open to confirm it or fix a line." },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RecordPage token={token} />;
}
