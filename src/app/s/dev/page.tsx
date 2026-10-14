import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DevShare } from "./dev-share";

/** A dev view: never in a search engine. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Shared chats from the core's own snapshots, with no network, while building: /s/dev?f=chat-en. Not in a production build. */
export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { f } = await searchParams;
  return <DevShare name={f ?? null} />;
}
