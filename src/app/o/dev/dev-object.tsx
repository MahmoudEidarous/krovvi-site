"use client";

import { ObjectView } from "@/components/objects/object-view";
import { FIXTURES } from "@/components/objects/fixtures";

export function DevObject({ kind, state }: { kind: string | null; state: string | null }) {
  const states = kind ? FIXTURES[kind] ?? {} : {};
  const fixture = state ? states[state] : Object.values(states)[0];
  if (!kind || !fixture) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">Objects on the page</h1>
        {Object.entries(FIXTURES).map(([k, all]) => (
          <div key={k} className="mb-3">
            <div className="text-sm text-muted">{k}</div>
            {Object.keys(all).map((s) => (
              <a key={s} href={`/o/dev?kind=${k}&state=${s}`} className="mr-3 text-sm underline">
                {s}
              </a>
            ))}
          </div>
        ))}
      </main>
    );
  }
  return <ObjectView key={`${kind}-${state}`} fixture={fixture as never} />;
}
