import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Phone } from "@/components/phone";

import { SCENES } from "./scenes";

/**
 * Every piece of the Deep kit (src/components/deep), in phones side by side on
 * black, with scripted sample content. For the design review only: never
 * indexed and linked from nowhere. `?shot=<id>` draws one scene alone at the
 * phone's 393 x 852 points, for comparison pictures against the app.
 */
export const metadata: Metadata = {
  title: "Deep kit",
  robots: { index: false, follow: false },
};

/** Next's own badge in development, kept out of the pictures. */
const HIDE_DEV_BADGE = "nextjs-portal{display:none!important}";

export default async function DeepDevPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // A design review page, for development only, as /s/dev and /o/dev are: never served by the live site.
  if (process.env.NODE_ENV === "production") notFound();
  const { shot } = await searchParams;
  const one = typeof shot === "string" ? SCENES.find((s) => s.id === shot) : undefined;
  if (one) {
    return (
      <main style={{ background: "#000", width: 393, height: 852, overflow: "hidden" }}>
        <style>{HIDE_DEV_BADGE}</style>
        <div style={{ position: "relative", width: 393, height: 852 }}>{one.draw()}</div>
      </main>
    );
  }
  return (
    <main style={{ background: "#000", minHeight: "100vh", padding: "48px 32px 96px", color: "#EDEDEB" }}>
      <style>{HIDE_DEV_BADGE}</style>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.6px", margin: "0 0 8px" }}>Deep kit</h1>
      <p style={{ color: "#8F8F8A", fontSize: 15, margin: "0 0 40px", maxWidth: 640 }}>
        Today&apos;s app screens, drawn from the app&apos;s own numbers (catch8 272d7cc5). Each phone is one scene; add ?shot= and its id for the bare 393 by 852 canvas.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
        {SCENES.map((scene) => (
          <Figure key={scene.id} id={scene.id} title={scene.title}>
            {scene.draw()}
          </Figure>
        ))}
      </div>
    </main>
  );
}

function Figure({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <figure style={{ margin: 0, width: 300 }}>
      <Phone shadow={false} label={title}>
        {children}
      </Phone>
      <figcaption style={{ marginTop: 14, fontSize: 13, color: "#A9A8A2" }}>
        {title} <span style={{ color: "#7A7A74" }}>({id})</span>
      </figcaption>
    </figure>
  );
}
