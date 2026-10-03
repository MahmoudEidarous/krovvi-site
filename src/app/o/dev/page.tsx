import { notFound } from "next/navigation";

import { DevObject } from "./dev-object";

/**
 * Every kind's fixtures on the page, with no network, while building:
 * /o/dev?kind=countdown&state=lisbon-en. The payloads are the core's own
 * (catch8 server/src/lib/objects/page-fixtures.ts writes them into
 * src/components/objects/fixtures), so the page draws exactly what the
 * server will send. Not in a production build.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string; state?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { kind, state } = await searchParams;
  return <DevObject kind={kind ?? null} state={state ?? null} />;
}
