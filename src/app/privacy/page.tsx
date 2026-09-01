import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy, Krovvi" };

const h2 = "mt-10 text-xl font-semibold tracking-[-0.01em]";
const p = "mt-3 text-base leading-[1.7] text-[var(--soft)]";
const li = "mt-3 text-base leading-[1.7] text-[var(--soft)]";

export default function Privacy() {
  return (
    <main className="px-6 pb-24 pt-16">
      <div className="mx-auto max-w-[640px]">
        <a href="/" className="mb-8 inline-block text-sm text-[var(--muted)] no-underline hover:text-[var(--fg)]">
          &larr; krovvi.com
        </a>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Privacy Policy</h1>
        <div className="mt-2 text-sm text-[var(--faint)]">Effective September 1, 2026</div>

        <p className={p}>
          Krovvi turns what you say into notes, tasks, and a personal memory. That only works if
          the app handles your words with care. This page explains what we collect, why, and what
          we never do.
        </p>

        <h2 className={h2}>What we collect</h2>
        <ul className="list-disc pl-6">
          <li className={li}>
            <b className="text-[var(--fg)]">Account.</b> You sign in with Apple or Google. We
            receive your name and email address, and use them only to identify your account.
          </li>
          <li className={li}>
            <b className="text-[var(--fg)]">Your content.</b> Recordings you make, documents you
            import, notes you write, and photos you attach. This content is uploaded to our
            servers so it can be transcribed, summarized, and made searchable for you.
          </li>
          <li className={li}>
            <b className="text-[var(--fg)]">Derived content.</b> Krovvi creates summaries, tasks,
            and memory entries (for example, people and plans you mention) from your content.
            These belong to your account like everything else.
          </li>
          <li className={li}>
            <b className="text-[var(--fg)]">Diagnostics.</b> Crash and performance reports, so we
            can fix problems. These are not tied to the content of your notes.
          </li>
        </ul>

        <h2 className={h2}>How your content is processed</h2>
        <p className={p}>
          Transcription and summarization run on cloud AI services acting as our service
          providers. They process your content only to provide the service to you. We do not use
          your content to train AI models, and we do not allow our providers to do so.
        </p>

        <h2 className={h2}>Connected accounts</h2>
        <p className={p}>
          If you choose to connect Google (email, calendar, files), Krovvi accesses only what is
          needed to do what you asked. Anything that sends on your behalf, like an email, requires
          your explicit confirmation in the app first. You can disconnect at any time.
        </p>

        <h2 className={h2}>What we never do</h2>
        <ul className="list-disc pl-6">
          <li className={li}>No ads, and no ad tracking.</li>
          <li className={li}>We never sell your data.</li>
          <li className={li}>
            We never share your content with third parties, except the service providers that make
            the app work.
          </li>
        </ul>

        <h2 className={h2}>Deleting your data</h2>
        <p className={p}>
          You can delete your account from Settings inside the app. This permanently deletes your
          recordings, notes, memory, and account data from our servers.
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={p}>
          Questions about privacy:{" "}
          <a href="mailto:support@krovvi.com" className="text-[var(--fg)]">
            support@krovvi.com
          </a>
        </p>
      </div>
    </main>
  );
}
