"use client";

import { useEffect, useState } from "react";

import { starLayers } from "@/lib/sky/stars";

/**
 * The app's sky inside a drawn phone: the same three distances on a screen
 * of 393 by 852 points, held still (a phone on a page is a picture; its own
 * stars drifting against the page's would read as a hole in the glass, not a
 * screen).
 *
 * Painted once per sky into a picture three times the points (sharp when a
 * phone is scaled up), and that one picture is shared by every phone on the
 * page: a canvas per phone would hold about 12 MB each, and iPhone Safari
 * blanks canvases once a page holds too many.
 *
 * The picture is the stars' light alone, on nothing, and it is laid on as a
 * mask over the stars' ivory, not as a background picture: it looks the same,
 * and the page's largest paint stays the headline (a phone's sky counted as
 * the largest picture and landed two seconds late on a slow phone).
 */

const W = 393;
const H = 852;
const S = 3;

const painted = new Map<string, Promise<string>>();

/**
 * One sky is painted at a time, and its canvas is let go the moment its
 * picture is made: a page with several skies never holds two canvases of
 * about 12 MB at once (iPhone Safari blanks canvases past its own limit).
 */
let queue: Promise<unknown> = Promise.resolve();

function paint(seed: number, light: number): Promise<string> {
  const key = `${seed}:${light}`;
  const known = painted.get(key);
  if (known) return known;
  const made = queue.then(
    () =>
      new Promise<string>((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = W * S;
        canvas.height = H * S;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");
        ctx.setTransform(S, 0, 0, S, 0, 0);
        for (const layer of starLayers(W, H, seed)) {
          for (const batch of layer.batches) {
            const p = new Path2D();
            for (const pt of batch.points) {
              if (pt.y > H) continue;
              if (layer.spec.glow > 0) {
                const reach = batch.r * layer.spec.glow;
                const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, reach);
                g.addColorStop(0, `rgba(237,237,235,${0.32 * batch.a * light})`);
                g.addColorStop(1, "rgba(237,237,235,0)");
                ctx.fillStyle = g;
                ctx.fillRect(pt.x - reach, pt.y - reach, reach * 2, reach * 2);
              }
              p.moveTo(pt.x + batch.r, pt.y);
              p.arc(pt.x, pt.y, batch.r, 0, Math.PI * 2);
            }
            ctx.fillStyle = "#EDEDEB";
            ctx.globalAlpha = batch.a * light;
            ctx.fill(p);
            ctx.globalAlpha = 1;
          }
        }
        canvas.toBlob((blob) => {
          // Let the canvas's memory go now rather than whenever it is collected.
          canvas.width = 0;
          canvas.height = 0;
          resolve(blob ? URL.createObjectURL(blob) : "");
        }, "image/png");
      })
  );
  queue = made.catch(() => undefined);
  painted.set(key, made);
  return made;
}

export function PhoneSky({ seed = 7, light = 1 }: { seed?: number; light?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    void paint(seed, light).then((u) => {
      if (live) setUrl(u);
    });
    return () => {
      live = false;
    };
  }, [seed, light]);
  const mask = url ? `url(${url})` : undefined;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 h-[852px] w-[393px] transition-opacity duration-700"
      style={{
        background: "#EDEDEB",
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: "393px 852px",
        WebkitMaskSize: "393px 852px",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        opacity: url ? 1 : 0,
      }}
    />
  );
}
