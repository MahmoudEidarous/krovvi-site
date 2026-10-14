// Draws every picture of Krovvi's identity from the brand masters and lib/identity.ts, into the places Next reads:
//   src/app/favicon.ico          16 and 32: the seven-dot K snapped to whole pixels; 48: the eleven-dot K (both on the rounded tile)
//   src/app/apple-icon.png       180, the app icon (eleven dots, full bleed: iOS rounds it)
//   public/brand/krovvi-192.png  the manifest's icon
//   public/brand/krovvi-512.png  the manifest's large and maskable icon, and the Organization logo
//   src/app/opengraph-image.png  1200 x 630, the link preview picture (twitter-image.png is the same file)
// src/app/icon.svg is the app's brand/favicon.svg itself and is not drawn here.
//
//   node scripts/identity/build.mjs                       layout A, the tagline from lib/identity.ts
//   node scripts/identity/build.mjs --variant b           another layout (a, b or c)
//   node scripts/identity/build.mjs --line "The AI that knows|your life."   where the tagline breaks
//   node scripts/identity/build.mjs --review <folder>     also all three layouts, at 1x and 2x, into a folder
//
// When the picture's words change, change SHARE_IMAGE_ALT in lib/identity.ts and the two .alt.txt files with it.
// Masters: catch8 brand/favicon.svg (seven dots, r 30 on 480, tile rx 100), brand/icon-1024.svg (eleven dots, r 49.4).
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { render, writeIco } from "./render.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const variant = arg("--variant") ?? "a";
const review = arg("--review");

const tagline = readFileSync(join(ROOT, "src/lib/identity.ts"), "utf8").match(/^\s*tagline: "([^"]+)",/m)?.[1];
if (!tagline) throw new Error("No tagline in src/lib/identity.ts");
// Unless told, the line breaks before its last two words ("The AI that knows|your life.").
const words = tagline.split(" ");
const line = arg("--line") ?? `${words.slice(0, -2).join(" ")}|${words.slice(-2).join(" ")}`;
if (line.replace("|", " ") !== tagline) console.warn(`Note: the picture says "${line.replace("|", " ")}", identity.ts says "${tagline}".`);

const INK = "#EDEDEB";
const TILE = "#0A0A0A";
const ELEVEN = [[358.0, 268.8], [358.0, 390.4], [358.0, 512.0], [358.0, 633.6], [358.0, 755.2], [464.4, 436.0], [570.8, 360.0], [677.2, 284.0], [464.4, 588.0], [570.8, 664.0], [677.2, 740.0]];
// The seven dots of brand/favicon.svg on whole pixels: at 16 each dot is a 2 by 2 block, at 32 a circle of radius 2.
const SEVEN_16 = [[5, 4], [5, 8], [5, 12], [8, 6], [11, 4], [8, 10], [11, 12]];
const SEVEN_32 = [[11, 8], [11, 16], [11, 24], [16, 12], [21, 8], [16, 20], [21, 24]];

const circles = (dots, r) => dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join("");
const page = (svg, bg = "transparent") => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}svg{display:block;width:100vw;height:100vh}</style>${svg}`;
const tile = (size) => `<rect width="${size}" height="${size}" rx="${(100 / 480) * size}" fill="${TILE}"/>`;

const work = mkdtempSync(join(tmpdir(), "krovvi-identity-"));
try {
  const pages = {
    "ico-16": page(`<svg viewBox="0 0 16 16">${tile(16)}${SEVEN_16.map(([x, y]) => `<rect x="${x - 1}" y="${y - 1}" width="2" height="2" fill="${INK}" shape-rendering="crispEdges"/>`).join("")}</svg>`),
    "ico-32": page(`<svg viewBox="0 0 32 32">${tile(32)}${circles(SEVEN_32, 2)}</svg>`),
    "ico-48": page(`<svg viewBox="0 0 1024 1024">${tile(1024)}${circles(ELEVEN, 49.4)}</svg>`),
    "app-icon": page(`<svg viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${TILE}"/>${circles(ELEVEN, 49.4)}</svg>`, TILE),
  };
  for (const [name, html] of Object.entries(pages)) writeFileSync(join(work, `${name}.html`), html);
  const url = (name) => pathToFileURL(join(work, `${name}.html`)).href;
  const share = (v) => `${pathToFileURL(join(import.meta.dirname, "share.html")).href}?v=${v}&line=${encodeURIComponent(line)}`;
  const out = (name) => join(work, name);

  const jobs = [
    { url: url("ico-16"), width: 16, height: 16, out: out("16.png"), transparent: true },
    { url: url("ico-32"), width: 32, height: 32, out: out("32.png"), transparent: true },
    { url: url("ico-48"), width: 48, height: 48, out: out("48.png"), transparent: true },
    { url: url("app-icon"), width: 180, height: 180, out: out("180.png") },
    { url: url("app-icon"), width: 192, height: 192, out: out("192.png") },
    { url: url("app-icon"), width: 512, height: 512, out: out("512.png") },
    { url: share(variant), width: 1200, height: 630, out: out("share.png") },
  ];
  if (review) {
    mkdirSync(review, { recursive: true });
    for (const v of ["a", "b", "c"]) {
      jobs.push({ url: share(v), width: 1200, height: 630, out: join(review, `share-${v}.png`) });
      jobs.push({ url: share(v), width: 1200, height: 630, scale: 2, out: join(review, `share-${v}@2x.png`) });
    }
  }
  await render(jobs);

  writeIco(join(ROOT, "src/app/favicon.ico"), [out("16.png"), out("32.png"), out("48.png")]);
  copyFileSync(out("180.png"), join(ROOT, "src/app/apple-icon.png"));
  mkdirSync(join(ROOT, "public/brand"), { recursive: true });
  copyFileSync(out("192.png"), join(ROOT, "public/brand/krovvi-192.png"));
  copyFileSync(out("512.png"), join(ROOT, "public/brand/krovvi-512.png"));
  copyFileSync(out("share.png"), join(ROOT, "src/app/opengraph-image.png"));
  copyFileSync(out("share.png"), join(ROOT, "src/app/twitter-image.png"));
  console.log(`Drawn: favicon.ico, apple-icon.png, brand/krovvi-192.png and -512.png, the share image (layout ${variant}: "${line}")${review ? `, and the review set in ${review}` : ""}.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
