import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { POLICY } from "./policy";

export const metadata: Metadata = { title: "Privacy Policy, Krovvi" };

/** Plain text with any email address turned into a link. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+[a-z])/i);
  return (
    <>
      {parts.map((part, i) =>
        /@/.test(part) ? (
          <a key={i} href={`mailto:${part}`} className="text-ink underline decoration-[var(--faint)] underline-offset-4 hover:decoration-[var(--fg)]">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Privacy() {
  const [updated, ...rest] = POLICY;
  return (
    <>
      <SiteNav home={false} />
      <main className="px-5 pb-10 pt-[120px] md:pt-[150px]">
        <article className="mx-auto max-w-[680px]">
          <h1 className="text-[clamp(40px,6vw,60px)] font-semibold leading-[1.04] tracking-[-0.04em]">Privacy Policy</h1>
          {"p" in updated && <p className="mt-4 text-[15px] text-faint">{updated.p}</p>}
          <div className="mt-6">
            {rest.map((block, i) => {
              if ("h" in block) {
                return (
                  <h2 key={i} className="mt-12 text-[24px] font-semibold tracking-[-0.02em]">
                    {block.h}
                  </h2>
                );
              }
              if ("li" in block) {
                return (
                  <ul key={i} className="mt-4 flex flex-col gap-3">
                    {block.li.map((item, j) => (
                      <li key={j} className="flex gap-3 text-[17px] leading-[1.65] text-soft">
                        <span className="mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-faint" />
                        <span>
                          <Linked text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="mt-4 text-[17px] leading-[1.7] text-soft">
                  <Linked text={block.p} />
                </p>
              );
            })}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
