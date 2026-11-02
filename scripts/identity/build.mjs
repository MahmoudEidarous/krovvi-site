// Draws every picture of Krovvi's identity from the Heavy k (scripts/identity/k.mjs, the app icon's own strokes) and
// lib/identity.ts, into the places Next reads:
//   src/app/icon.svg             the k on its purple tile, rounded (what a browser tab shows where it can draw SVG)
//   src/app/favicon.ico          16, 32 and 48, the same tile
//   src/app/apple-icon.png       180, the app icon full bleed (iOS rounds it)
//   public/brand/krovvi-192.png  the manifest's icon
//   public/brand/krovvi-512.png  the manifest's large and maskable icon, and the Organization logo (the k sits inside
//                                the middle 80 percent, so the same file is a maskable icon)
//   src/app/opengraph-image.png  1200 x 630, the link preview picture (twitter-image.png is the same file): the light
//                                look, the name, the tagline and the real app in a phone (public/app, scripts/app-shots)
//
//   node scripts/identity/build.mjs                      the tagline from lib/identity.ts
//   node scripts/identity/build.mjs --review <folder>    also the share image at 2x, into a folder
//
// When the picture's words change, change SHARE_IMAGE_ALT in lib/identity.ts and the two .alt.txt files with it.
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { icon } from "./k.mjs";
import { render, writeIco } from "./render.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const review = arg("--review");

const tagline = readFileSync(join(ROOT, "src/lib/identity.ts"), "utf8").match(/^\s*tagline: "([^"]+)",/m)?.[1];
if (!tagline) throw new Error("No tagline in src/lib/identity.ts");

const page = (svg, bg = "transparent") =>
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}svg{display:block;width:100vw;height:100vh}</style>${svg}`;

const work = mkdtempSync(join(tmpdir(), "krovvi-identity-"));
try {
  const pages = {
    "ico-16": page(icon(16, true)),
    "ico-32": page(icon(32, true)),
    "ico-48": page(icon(48, true)),
    "app-icon": page(icon(1024, false), "#7B6BFF"),
  };
  for (const [name, html] of Object.entries(pages)) writeFileSync(join(work, `${name}.html`), html);
  const url = (name) => pathToFileURL(join(work, `${name}.html`)).href;
  const share = `${pathToFileURL(join(import.meta.dirname, "share.html")).href}?line=${encodeURIComponent(tagline)}`;
  const out = (name) => join(work, name);

  const jobs = [
    { url: url("ico-16"), width: 16, height: 16, out: out("16.png"), transparent: true },
    { url: url("ico-32"), width: 32, height: 32, out: out("32.png"), transparent: true },
    { url: url("ico-48"), width: 48, height: 48, out: out("48.png"), transparent: true },
    { url: url("app-icon"), width: 180, height: 180, out: out("180.png") },
    { url: url("app-icon"), width: 192, height: 192, out: out("192.png") },
    { url: url("app-icon"), width: 512, height: 512, out: out("512.png") },
    { url: share, width: 1200, height: 630, out: out("share.png") },
  ];
  if (review) {
    mkdirSync(review, { recursive: true });
    jobs.push({ url: share, width: 1200, height: 630, scale: 2, out: join(review, "share@2x.png") });
  }
  await render(jobs);

  writeFileSync(join(ROOT, "src/app/icon.svg"), `${icon(480, true)}\n`);
  writeIco(join(ROOT, "src/app/favicon.ico"), [out("16.png"), out("32.png"), out("48.png")]);
  copyFileSync(out("180.png"), join(ROOT, "src/app/apple-icon.png"));
  mkdirSync(join(ROOT, "public/brand"), { recursive: true });
  copyFileSync(out("192.png"), join(ROOT, "public/brand/krovvi-192.png"));
  copyFileSync(out("512.png"), join(ROOT, "public/brand/krovvi-512.png"));
  copyFileSync(out("share.png"), join(ROOT, "src/app/opengraph-image.png"));
  copyFileSync(out("share.png"), join(ROOT, "src/app/twitter-image.png"));
  if (review) copyFileSync(out("share.png"), join(review, "share.png"));
  console.log(`Drawn: icon.svg, favicon.ico, apple-icon.png, brand/krovvi-192.png and -512.png, and the share image ("${tagline}").`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
