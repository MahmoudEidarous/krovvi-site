// The chat's ground in a colour, read off that colour's own screens: the mean of the left edge of every exchange's
// cut (the ground is a soft sky, so the page stands the chat on its middle tone: --chat in src/app/home.css).
//   node scripts/app-shots/ground.mjs [--raw ~/.krovvi/site19/raw]
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const RAW = args.includes("--raw") ? args[args.indexOf("--raw") + 1] : join(homedir(), ".krovvi/site19/raw");
const cuts = JSON.parse(readFileSync(join(HERE, "..", "..", "public/app/shots.json"), "utf8")).cuts ?? {};
let r = 0;
let g = 0;
let b = 0;
let n = 0;
const lo = [255, 255, 255];
const hi = [0, 0, 0];
for (const [name, cut] of Object.entries(cuts)) {
  const file = join(RAW, `${name}.png`);
  if (!existsSync(file) || cut.seam) continue;
  const { data, info } = await sharp(file).removeAlpha().extract({ left: 4, top: cut.y, width: 6, height: cut.h }).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const p = [data[i], data[i + 1], data[i + 2]];
    r += p[0];
    g += p[1];
    b += p[2];
    n += 1;
    for (let c = 0; c < 3; c += 1) {
      lo[c] = Math.min(lo[c], p[c]);
      hi[c] = Math.max(hi[c], p[c]);
    }
  }
}
const hex = (v) => Math.round(v).toString(16).padStart(2, "0").toUpperCase();
console.log(`#${hex(r / n)}${hex(g / n)}${hex(b / n)}  (from #${lo.map(hex).join("")} to #${hi.map(hex).join("")}, ${n} points)`);
