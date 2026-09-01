import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support, Krovvi" };

export default function Support() {
  return (
    <main className="px-6 pb-24 pt-16">
      <div className="mx-auto max-w-[640px]">
        <a href="/" className="mb-8 inline-block text-sm text-[var(--muted)] no-underline hover:text-[var(--fg)]">
          &larr; krovvi.com
        </a>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Support</h1>
        <p className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
          Something broken, confusing, or missing? Tell us and we will fix it.
        </p>

        <h2 className="mt-10 text-xl font-semibold tracking-[-0.01em]">Contact</h2>
        <p className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
          Email{" "}
          <a href="mailto:support@krovvi.com" className="text-[var(--fg)]">
            support@krovvi.com
          </a>{" "}
          and include:
        </p>
        <ul className="list-disc pl-6">
          <li className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
            What you were doing and what happened instead
          </li>
          <li className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
            Your iPhone model and iOS version
          </li>
          <li className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
            A screenshot, if it helps show the problem
          </li>
        </ul>
        <p className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
          We read everything and usually reply within a day or two.
        </p>

        <h2 className="mt-10 text-xl font-semibold tracking-[-0.01em]">Your data</h2>
        <p className="mt-3 text-base leading-[1.7] text-[var(--soft)]">
          You can delete your account and everything in it from Settings inside the app. See our{" "}
          <a href="/privacy" className="text-[var(--fg)]">
            privacy policy
          </a>{" "}
          for the full picture.
        </p>
      </div>
    </main>
  );
}
