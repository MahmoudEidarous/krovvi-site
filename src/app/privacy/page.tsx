import type { Metadata, Viewport } from "next";

import { LookShell } from "@/components/look/shell";
import { subpageMetadata } from "@/lib/identity";

import "../look.css";
import { POLICY } from "./policy";

/** "Privacy Policy | Krovvi", its own description and preview (lib/identity.ts). */
export const metadata: Metadata = subpageMetadata("/privacy");

export const viewport: Viewport = { themeColor: "#F8F7FF", colorScheme: "light" };

/** Plain text with any email address turned into a link. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+[a-z])/i);
  return (
    <>
      {parts.map((part, i) => (/@/.test(part) ? <a key={i} href={`mailto:${part}`}>{part}</a> : <span key={i}>{part}</span>))}
    </>
  );
}

export default function Privacy() {
  const [updated, ...rest] = POLICY;
  return (
    <LookShell home={false}>
      <main className="doc">
        <article>
          <h1>Privacy Policy</h1>
          {"p" in updated && <p className="up">{updated.p}</p>}
          {rest.map((block, i) => {
            if ("h" in block) return <h2 key={i}>{block.h}</h2>;
            if ("li" in block)
              return (
                <ul key={i}>
                  {block.li.map((item, j) => (
                    <li key={j}>
                      <Linked text={item} />
                    </li>
                  ))}
                </ul>
              );
            return (
              <p key={i}>
                <Linked text={block.p} />
              </p>
            );
          })}
        </article>
      </main>
      <div className="doc-end" data-mode="dark" aria-hidden="true" />
    </LookShell>
  );
}
