// Draws the picture a messaging app shows under a link to a shared chat (src/app/s/[token]/page.tsx CARD), in English
// and Arabic, 1200 x 630: public/share-card-en.png and public/share-card-ar.png. The mark is the app's own icon,
// scripts/identity/app-icon.png, which is catch8 assets/images/icon.png (the file the app's app.json names, the new k
// of 1 November 2026, 8174b5de9) copied as it is; the dots it showed before are gone (the owner, 13 November 2026:
// "we do not have dots anymore").
//
//   node scripts/identity/share-cards.mjs
//
// When the app's icon changes, copy its icon.png over app-icon.png and run this again.
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { render } from "./render.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const page = pathToFileURL(join(import.meta.dirname, "share-card.html")).href;
await render(["en", "ar"].map((lang) => ({ url: `${page}?lang=${lang}`, width: 1200, height: 630, out: join(ROOT, `public/share-card-${lang}.png`) })));
console.log("Drawn: public/share-card-en.png and public/share-card-ar.png");
