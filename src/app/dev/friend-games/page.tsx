import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Phone } from "@/components/phone";

import { SCENES } from "./scenes";

/**
 * Today's games and Krovvi's question cards (src/components/deep/games.tsx
 * and asks.tsx), each in a full chat screen the way the app's captures show
 * them, for the design review only: never indexed and linked from nowhere.
 * `?shot=<id>` draws one scene alone at the phone's 393 x 852 points, for
 * comparison pictures against the app; `&frame=capture` draws it at the
 * captures' own 390 x 844 (the simulator's phone), so lines wrap as there.
 */
export const metadata: Metadata = {
  title: "Friend games",
  robots: { index: false, follow: false },
};

/** Next's own badge in development, kept out of the pictures. */
const HIDE_DEV_BADGE = "nextjs-portal{display:none!important}";

/** The simulator's phone in the captures: 390 x 844 points (the chat screen keeps its own insets). */
const CAPTURE_FRAME = ".dk-capture-frame>div{width:390px!important;height:844px!important}";

export default async function FriendGamesDevPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // A design review page, for development only, as /s/dev and /o/dev are: never served by the live site.
  if (process.env.NODE_ENV === "production") notFound();
  const { shot, frame } = await searchParams;
  const one = typeof shot === "string" ? SCENES.find((s) => s.id === shot) : undefined;
  if (one) {
    const [w, h] = frame === "capture" ? [390, 844] : [393, 852];
    return (
      <main style={{ background: "#000", width: w, height: h, overflow: "hidden" }}>
        <style>{HIDE_DEV_BADGE}</style>
        {frame === "capture" ? <style>{CAPTURE_FRAME}</style> : null}
        <div className="dk-capture-frame" style={{ position: "relative", width: w, height: h }}>
          {one.draw()}
        </div>
      </main>
    );
  }
  return (
    <main style={{ background: "#000", minHeight: "100vh", padding: "48px 32px 96px", color: "#EDEDEB" }}>
      <style>{HIDE_DEV_BADGE}</style>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.6px", margin: "0 0 8px" }}>Friend games</h1>
      <p style={{ color: "#8F8F8A", fontSize: 15, margin: "0 0 40px", maxWidth: 680 }}>
        The games and Krovvi&apos;s question cards, drawn from the newest app build&apos;s own numbers (catch8 6edb7fca, store build 20). Each phone is one scene; add ?shot= and its id for the bare 393 by 852 canvas. Scenes marked moving replay when the page loads.
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
