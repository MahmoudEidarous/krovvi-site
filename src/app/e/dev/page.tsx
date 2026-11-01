import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { POST_FIXTURES } from "@/components/together/fixtures";
import { iosOfHeader, postMetadata } from "@/components/together/meta";
import { PostPage } from "@/components/together/post-page";

/**
 * Every Together post state with no network, while building: /e/dev lists them, /e/dev?f=episode draws one (episode,
 * episode-ar, talk-live, talk-done, plan, plan-settled, character, off). Writes pretend to go through after half a
 * second; &fail=1 makes them come back refused, to see the rollback. Its link preview tags are the real route's,
 * from the fixture. Only when NODE_ENV is development: anywhere else this page is not found.
 */

const NOINDEX = { index: false, follow: false } as const;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ f?: string }> }): Promise<Metadata> {
  if (process.env.NODE_ENV !== "development") return { robots: NOINDEX };
  const { f } = await searchParams;
  const fx = f ? POST_FIXTURES[f] : undefined;
  return fx ? { ...postMetadata(fx.read.ok ? fx.read.post.token : `dev_${f}_token_aaaaaaaa`, fx.read, "en"), robots: NOINDEX } : { title: "Together posts", robots: NOINDEX };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string; fail?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { f, fail } = await searchParams;
  const fx = f ? POST_FIXTURES[f] : undefined;
  if (!fx) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-10">
        <h1 className="mb-4 text-xl font-semibold">Together posts</h1>
        <ul className="grid gap-2">
          {Object.entries(POST_FIXTURES).map(([k, v]) => (
            <li key={k}>
              <a href={`/e/dev?f=${k}`} className="underline">{v.label}</a> <span className="opacity-50">({k})</span>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  const ios = iosOfHeader((await headers()).get("user-agent"));
  return <PostPage key={f} token={fx.read.ok ? fx.read.post.token : `dev_${f}_token_aaaaaaaa`} first={fx.read} ios={ios} fixture={{ fail: fail === "1", more: fx.more }} />;
}
