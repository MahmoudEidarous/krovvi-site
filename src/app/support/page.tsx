import type { Metadata, Viewport } from "next";

import { LookShell } from "@/components/look/shell";
import { subpageMetadata } from "@/lib/identity";
import { SUPPORT_EMAIL } from "@/lib/site";

import "../look.css";

/** "Support | Krovvi", its own description and preview (lib/identity.ts). */
export const metadata: Metadata = subpageMetadata("/support");

export const viewport: Viewport = { themeColor: "#F8F7FF", colorScheme: "light" };

export default function Support() {
  return (
    <LookShell home={false}>
      <main className="doc">
        <article>
          <h1>Support</h1>
          <p className="up">Something broken, confusing, or missing? Tell us and we will fix it.</p>

          <h2>Contact</h2>
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and include:
          </p>
          <ul>
            <li>What you were doing and what happened instead</li>
            <li>Your iPhone model and iOS version</li>
            <li>A screenshot, if it helps show the problem</li>
          </ul>
          <p>We read everything and usually reply within a day or two.</p>

          <h2>Your data</h2>
          <p>
            You can delete your account and everything in it from Settings inside the app. See our <a href="/privacy">privacy policy</a> for the full
            picture.
          </p>
        </article>
      </main>
      <div className="doc-end" data-mode="dark" aria-hidden="true" />
    </LookShell>
  );
}
