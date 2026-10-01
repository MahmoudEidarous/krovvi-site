import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Support, Krovvi" };

const p = "mt-4 text-[17px] leading-[1.7] text-soft";

export default function Support() {
  return (
    <>
      <SiteNav home={false} />
      <main className="px-5 pb-10 pt-[120px] md:pt-[150px]">
        <article className="mx-auto max-w-[680px]">
          <h1 className="text-[clamp(40px,6vw,60px)] font-semibold leading-[1.04] tracking-[-0.04em]">Support</h1>
          <p className={p}>Something broken, confusing, or missing? Tell us and we will fix it.</p>

          <h2 className="mt-12 text-[24px] font-semibold tracking-[-0.02em]">Contact</h2>
          <p className={p}>
            Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ink underline decoration-[var(--faint)] underline-offset-4">
              {SUPPORT_EMAIL}
            </a>{" "}
            and include:
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {[
              "What you were doing and what happened instead",
              "Your iPhone model and iOS version",
              "A screenshot, if it helps show the problem",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[17px] leading-[1.65] text-soft">
                <span className="mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-faint" />
                {item}
              </li>
            ))}
          </ul>
          <p className={p}>We read everything and usually reply within a day or two.</p>

          <h2 className="mt-12 text-[24px] font-semibold tracking-[-0.02em]">Your data</h2>
          <p className={p}>
            You can delete your account and everything in it from Settings inside the app. See our{" "}
            <a href="/privacy" className="text-ink underline decoration-[var(--faint)] underline-offset-4">
              privacy policy
            </a>{" "}
            for the full picture.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
