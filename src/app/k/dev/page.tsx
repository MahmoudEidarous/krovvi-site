import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { INVITE_FIXTURES } from "@/components/together/fixtures";
import { InvitePage } from "@/components/together/invite-page";
import { inviteMetadata, iosOfHeader } from "@/components/together/meta";

/**
 * Every Together invite state with no network, while building: /k/dev lists them, /k/dev?f=invite draws one (invite,
 * invite-ar, no-character, ran-out, off), with the real route's link preview tags. Only when NODE_ENV is
 * development: anywhere else this page is not found.
 */

const NOINDEX = { index: false, follow: false } as const;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ f?: string }> }): Promise<Metadata> {
  if (process.env.NODE_ENV !== "development") return { robots: NOINDEX };
  const { f } = await searchParams;
  const fx = f ? INVITE_FIXTURES[f] : undefined;
  return fx ? { ...inviteMetadata(fx.read.ok ? fx.read.invite.code : "DEVCODE0", fx.read, fx.lang), robots: NOINDEX } : { title: "Together invites", robots: NOINDEX };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { f } = await searchParams;
  const fx = f ? INVITE_FIXTURES[f] : undefined;
  if (!fx) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">Together invites</h1>
        <ul className="grid gap-2">
          {Object.entries(INVITE_FIXTURES).map(([k, v]) => (
            <li key={k}>
              <a href={`/k/dev?f=${k}`} className="underline">{v.label}</a> <span className="opacity-50">({k})</span>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  const ios = iosOfHeader((await headers()).get("user-agent"));
  return <InvitePage key={f} code={fx.read.ok ? fx.read.invite.code : "DEVCODE0"} first={fx.read} ios={ios} lang={fx.lang} />;
}
