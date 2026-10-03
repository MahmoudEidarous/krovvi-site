"use client";

import { SharePage } from "@/components/share/share-page";
import fixtures from "@/components/share/fixtures.json";
import type { ShareRead } from "@/lib/share";

const ALL = fixtures as unknown as Record<string, ShareRead>;

export function DevShare({ name }: { name: string | null }) {
  const share = name ? ALL[name] : null;
  if (!share) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">Shared chats</h1>
        {Object.keys(ALL).map((k) => (
          <a key={k} href={`/s/dev?f=${k}`} className="mr-4 underline">
            {k}
          </a>
        ))}
      </main>
    );
  }
  return <SharePage key={name ?? ""} fixture={share} />;
}
