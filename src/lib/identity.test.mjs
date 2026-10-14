// Krovvi's identity (identity.ts and the pictures and files built from it), run with `npm test` (node --test; Node
// strips the types). Kept as .mjs so the site's type check and build leave it alone. identity.ts imports "./site"
// without an extension, as Next wants; the hook below lets Node find it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\//.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { IDENTITY, PAGES, ABOUT, SHARE_IMAGE_ALT, llmsText, structuredData, structuredDataScript } = await import("./identity.ts");

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const text = (path) => read(path).toString("utf8");
const EM_DASH = "—";

test("no em dash in any word a person, a search engine or an AI reads", () => {
  const words = JSON.stringify([IDENTITY, PAGES, ABOUT, SHARE_IMAGE_ALT, llmsText(), structuredData()]);
  assert.equal(words.includes(EM_DASH), false);
  for (const file of [
    "src/lib/identity.ts",
    "src/app/layout.tsx",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
    "src/app/manifest.ts",
    "src/app/llms.txt/route.ts",
    "src/app/opengraph-image.alt.txt",
    "src/app/twitter-image.alt.txt",
    "scripts/identity/build.mjs",
    "scripts/identity/render.mjs",
    "scripts/identity/share.html",
  ]) {
    assert.equal(text(file).includes(EM_DASH), false, file);
  }
});

test("the share image's alt text is the same in identity.ts and in both .alt.txt files", () => {
  assert.equal(text("src/app/opengraph-image.alt.txt"), SHARE_IMAGE_ALT);
  assert.equal(text("src/app/twitter-image.alt.txt"), SHARE_IMAGE_ALT);
});

test("the title and description fit what Google shows without cutting them", () => {
  // Google cuts by width, not by count; about 60 and 160 characters is where a desktop result usually ends.
  assert.ok(IDENTITY.title.length <= 60, IDENTITY.title);
  for (const page of PAGES) assert.ok(page.description.length <= 160, page.description);
});

test("the structured data is one graph of the site, the company and the app, with no price and no rating", () => {
  const script = structuredDataScript();
  assert.equal(script.includes("<"), false);
  const data = JSON.parse(script);
  assert.equal(data["@context"], "https://schema.org");
  const byType = Object.fromEntries(data["@graph"].map((node) => [node["@type"], node]));
  assert.deepEqual(Object.keys(byType).sort(), ["MobileApplication", "Organization", "WebSite"]);
  assert.equal(byType.WebSite.name, "Krovvi");
  assert.equal(byType.WebSite.url, "https://krovvi.com/");
  assert.equal(byType.WebSite.alternateName, "krovvi.com");
  assert.equal(byType.Organization.name, byType.WebSite.name);
  assert.equal(byType.Organization.logo.url, "https://krovvi.com/brand/krovvi-512.png");
  assert.equal(byType.Organization.email, IDENTITY.email);
  assert.equal(byType.MobileApplication.operatingSystem, "iOS");
  for (const never of ["offers", "price", "aggregateRating", "review", "ratingValue"]) assert.equal(script.includes(`"${never}"`), false, never);
  // Nothing empty goes out: no founder or profiles until the owner gives them.
  if (!IDENTITY.founder) assert.equal("founder" in byType.Organization, false);
  if (IDENTITY.sameAs.length === 0) assert.equal("sameAs" in byType.Organization, false);
});

test("/llms.txt has a name, a summary, the address to write to and every page", () => {
  const llms = llmsText();
  assert.ok(llms.startsWith(`# ${IDENTITY.name}\n\n> ${IDENTITY.description}\n`));
  assert.ok(llms.includes(IDENTITY.email));
  for (const page of PAGES) assert.ok(llms.includes(page.path === "/" ? "https://krovvi.com/" : `https://krovvi.com${page.path}`), page.path);
});

const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test("the pictures are the sizes the platforms ask for", () => {
  for (const name of ["opengraph-image", "twitter-image"]) {
    const png = read(`src/app/${name}.png`);
    assert.deepEqual(pngSize(png), [1200, 630], name);
    // WhatsApp drops a preview picture that is too heavy; 300 KB is the safe side of every report.
    assert.ok(png.length < 300_000, `${name} is ${png.length} bytes`);
  }
  assert.deepEqual(pngSize(read("src/app/apple-icon.png")), [180, 180]);
  assert.deepEqual(pngSize(read(IDENTITY.logo.path.replace(/^\//, "public/"))), [512, 512]);
  assert.deepEqual(pngSize(read("public/brand/krovvi-192.png")), [192, 192]);
  const ico = read("src/app/favicon.ico");
  assert.equal(ico.readUInt16LE(2), 1);
  const frames = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico.readUInt8(6 + 16 * i));
  assert.deepEqual(frames, [16, 32, 48]);
});
