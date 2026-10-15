import { readFile } from "node:fs/promises";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamBoard } from "@/components/team/board";
import type { Snapshot } from "@/lib/team";

/** A dev view: never in a search engine. */
export const metadata: Metadata = { title: { absolute: "Krovvi Team (snapshot)" }, robots: { index: false, follow: false } };

/**
 * The board drawn from a snapshot of what the two database functions
 * answered, while building: /team/dev, with TEAM_BOARD_SNAPSHOT naming the
 * file. The snapshot holds real names, so it stays on the building machine
 * and never in this repository. Not in a production build.
 */
export default async function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  const path = process.env.TEAM_BOARD_SNAPSHOT;
  if (!path) return <p style={{ padding: 24 }}>Start the dev server with TEAM_BOARD_SNAPSHOT=/path/to/snapshot.json.</p>;
  const snapshot = JSON.parse(await readFile(path, "utf8")) as Snapshot;
  return (
    <>
      <style>{"nextjs-portal{display:none!important}"}</style>
      <TeamBoard snapshot={snapshot} />
    </>
  );
}
