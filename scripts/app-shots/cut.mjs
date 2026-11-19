// Sizes and cuts the app's raw screens (take.sh) into what krovvi.com serves, and writes public/app/shots.json.
//
//   node scripts/app-shots/cut.mjs [--raw ~/.krovvi/site19/raw] [--theme purple] [--only name,name]
//
// For every raw picture <name>.png (the phone's own 3x, 1206 x 2622):
//   public/app/<theme>/<name>.webp      804 wide (2x of the 402 point screen)
//   public/app/<theme>/<name>@3x.webp   1206 wide, for a phone drawn large or seen on a phone
// For a card's scene (card-<name>.png): the exchange alone, what was said, Krovvi's reply and the card under it, cut out
// of the chat between the top bar and the row of small marks under the reply:
//   public/app/<theme>/x-<name>.webp and x-<name>@3x.webp, and its size in points in shots.json (so the page holds its room).
// For every raw film <name>.mov: <name>.mp4 (804 wide, from just before the first move to just after the last),
// <name>.webp (its first moment) and, from <name>-end.png, <name>-end.webp (its last, sharper than the film's).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const RAW = opt("raw", join(homedir(), ".krovvi/site19/raw"));
const THEME = opt("theme", "purple");
const ONLY = opt("only", "")
  .split(",")
  .filter(Boolean);
const OUT = join(SITE, "public/app", THEME);
mkdirSync(OUT, { recursive: true });

const POINTS = 402; // the phone's screen, in points
const W3 = 1206;
const W2 = 804;
const want = (name) => !ONLY.length || ONLY.includes(name);

async function webp(input, name) {
  await sharp(input).resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 86, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  await sharp(input).resize({ width: W3, kernel: "lanczos3" }).webp({ quality: 84, effort: 6 }).toFile(join(OUT, `${name}@3x.webp`));
}

/**
 * Where an exchange stands in a card's scene: from the top of what they said to the bottom of the card. Read off the
 * picture itself: a row belongs to a bubble or the card when a good part of it is far from the chat's ground at the
 * picture's left edge (the ground is a soft sky, so each row is compared with its own edge).
 */
async function exchangeBox(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const top0 = Math.round(height * 0.16); // under the top bar and the day's line
  const bottom0 = Math.round(height * 0.84); // over the text box
  const busy = [];
  for (let y = 0; y < height; y += 1) {
    const row = y * width * channels;
    const gr = data[row + 6 * channels];
    const gg = data[row + 6 * channels + 1];
    const gb = data[row + 6 * channels + 2];
    let far = 0;
    for (let x = 0; x < width; x += 2) {
      const p = row + x * channels;
      if (Math.abs(data[p] - gr) + Math.abs(data[p + 1] - gg) + Math.abs(data[p + 2] - gb) > 14) far += 2;
    }
    busy.push(far / width);
  }
  // the day's line ("Today 11:01") is small grey words: the exchange starts at the first row that is mostly a bubble
  let top = top0;
  while (top < bottom0 && busy[top] < 0.2) top += 1;
  // the card is the last wide block; the small marks under it are narrow, so the end is the last row wider than a third
  let bottom = bottom0;
  while (bottom > top && busy[bottom] < 0.5) bottom -= 1;
  return { top, bottom, height, width };
}

/** The part of a card's scene that is its exchange, in the picture's own pixels: the same cut for its picture and its film. */
async function exchangeCut(file) {
  const box = await exchangeBox(file);
  // a little of the chat's ground over it, and room under it for the card's soft shadow (never the small marks below)
  const y = Math.max(0, box.top - 24);
  const h = Math.min(box.height - y, box.bottom - box.top + 24 + 36);
  return { y, h: h - (h % 2), width: box.width };
}

async function exchange(file, name) {
  const { y, h, width } = await exchangeCut(file);
  const box = { width };
  const cut = sharp(file).extract({ left: 0, top: y, width: box.width, height: h });
  await cut.clone().resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 88, effort: 6 }).toFile(join(OUT, `x-${name}.webp`));
  await cut.clone().webp({ quality: 86, effort: 6 }).toFile(join(OUT, `x-${name}@3x.webp`));
  return [POINTS, Math.round((h / box.width) * POINTS)];
}

/** A band of a screen, from one height to another in points: the app's top, its text box, a game without the phone's own bar. */
async function band(file, name, fromPt, toPt) {
  const meta = await sharp(file).metadata();
  const k = meta.width / POINTS;
  const cut = sharp(file).extract({ left: 0, top: Math.round(fromPt * k), width: meta.width, height: Math.round((toPt - fromPt) * k) });
  await cut.clone().resize({ width: W2, kernel: "lanczos3" }).webp({ quality: 88, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  await cut.clone().webp({ quality: 86, effort: 6 }).toFile(join(OUT, `${name}@3x.webp`));
  return [POINTS, Math.round(toPt - fromPt)];
}

const ffmpeg = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: ["ignore", "pipe", "pipe"] });
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

/** When the picture first moves and when it last settles, from the film itself. */
function moves(file) {
  let log = "";
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-i", file, "-vf", "freezedetect=n=0.0006:d=0.3", "-map", "0:v", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    log = String(e.stderr ?? "");
  }
  if (!log) {
    const r = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i '${file}' -vf freezedetect=n=0.0006:d=0.3 -map 0:v -f null - 2>&1 || true`]).toString();
    log = r;
  }
  const ev = [...log.matchAll(/freeze_(start|end): ([0-9.]+)/g)].map((m) => [m[1], Number(m[2])]);
  const firstEnd = ev.find((e) => e[0] === "end")?.[1] ?? null;
  let lastStart = null;
  for (const [kind, t] of ev) lastStart = kind === "start" ? t : null;
  return { firstEnd, lastStart };
}

async function film(file, name, how, cut = null) {
  const dur = probe(file);
  const { firstEnd, lastStart } = moves(file);
  let start = 0;
  if (how === "tap" && firstEnd !== null) start = Math.max(0, firstEnd - (cut ? 0.6 : 0.35));
  if (how === "ask" && firstEnd !== null) start = firstEnd + 0.55;
  if (how === "run") start = 0.2;
  let end = Math.min(dur, (lastStart ?? dur) + (cut ? 0.9 : 0.6));
  if (end - start < 1) end = dur;
  // an exchange's film is the same cut as its picture, so the one lies exactly over the other
  const crop = cut ? `crop=${cut.width}:${cut.h}:0:${cut.y},` : "";
  ffmpeg(["-ss", String(start), "-to", String(end), "-i", file, "-vf", `${crop}fps=30,scale=${W2}:-2:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", cut ? "20" : "23", "-profile:v", "high", "-movflags", "+faststart", "-an", join(OUT, `${name}.mp4`)]);
  if (!cut) {
    const first = join(RAW, `_first-${name}.png`);
    ffmpeg(["-ss", String(start), "-i", file, "-frames:v", "1", first]);
    await webp(first, name);
  }
  return Number(probe(join(OUT, `${name}.mp4`)).toFixed(2));
}

const shotsPath = join(SITE, "public/app/shots.json");
const old = existsSync(shotsPath) ? JSON.parse(readFileSync(shotsPath, "utf8")) : {};
const themes = old.themes ?? {};
const mine = themes[THEME] ?? {};
const stills = new Set(ONLY.length ? (mine.stills ?? []) : []);
const films = ONLY.length ? { ...(mine.films ?? {}) } : {};
const sizes = { ...(old.sizes ?? {}) };
// How each film starts, by its name: a tap's film from just before the first move; a chat that types by itself from the open.
const HOW = { vent: "ask", memory: "ask", news: "ask", flame: "ask", "card-focus": "run" };
/** What the page shows today: only these are sized and served (the raw folder keeps everything that was taken). */
const USED = new Set([
  "hero", "hero-great", "hero-okay", "hero-low", "hero-great-end", "hero-okay-end", "hero-low-end",
  "vent", "vent-end", "checkin", "checkin-end", "news", "news-end", "memory", "memory-end", "days", "days-end", "flame", "flame-end",
  "card-water", "card-skin", "card-focus", "card-sleep", "card-meal", "card-fitness", "card-reading", "card-money", "card-study",
  "page-money", "page-study", "page-food", "page-health", "page-habits", "page-todo",
  "game-chess-mid", "game-four-mid", "game-five-mid", "game-sudoku-mid", "game-fleet-mid", "game-hunt-mid", "game-higher-mid", "game-groups-mid", "game-trivia-mid", "game-countries-mid",
]);

const files = readdirSync(RAW).filter((f) => USED.has(basename(basename(f, ".png"), ".mov")));
for (const f of files.filter((x) => x.endsWith(".png")).sort()) {
  const name = basename(f, ".png");
  if (!want(name)) continue;
  if (name.startsWith("card-")) {
    // a card's scene is served as its exchange alone
    const key = name.slice(5);
    sizes[`x-${key}`] = await exchange(join(RAW, f), key);
    stills.add(`x-${key}`);
  } else if (name.startsWith("game-")) {
    // a game without the phone's own bar over it or its home line under it: the game's page as it is
    sizes[name] = await band(join(RAW, f), name, 52, 856);
    stills.add(name);
  } else {
    await webp(join(RAW, f), name);
    stills.add(name);
    if (name === "hero") {
      // the app's own top and its text box, for the phone the chat is scrolled in
      sizes["chrome-top"] = await band(join(RAW, f), "chrome-top", 0, 139);
      sizes["chrome-bot"] = await band(join(RAW, f), "chrome-bot", 748, 874);
      stills.add("chrome-top");
      stills.add("chrome-bot");
    }
  }
  console.log(`picture ${name}`);
}
for (const f of files.filter((x) => x.endsWith(".mov")).sort()) {
  const name = basename(f, ".mov");
  if (!want(name)) continue;
  if (name.startsWith("card-")) {
    // a card's film is served as its exchange alone, cut as its picture is (x-<name>.mp4 over x-<name>.webp)
    const key = name.slice(5);
    const cut = await exchangeCut(join(RAW, `${name}.png`));
    films[`x-${key}`] = await film(join(RAW, f), `x-${key}`, HOW[name] ?? "tap", cut);
    console.log(`film x-${key}: ${films[`x-${key}`]}s`);
    continue;
  }
  films[name] = await film(join(RAW, f), name, HOW[name] ?? "tap");
  stills.add(name);
  console.log(`film ${name}: ${films[name]}s`);
}
themes[THEME] = { stills: [...stills].sort(), films };
const framesPath = join(RAW, "frames.json");
const frames = { ...(old.frames ?? {}), ...(existsSync(framesPath) ? JSON.parse(readFileSync(framesPath, "utf8")) : {}) };
const stamp = new Date();
const pad = (n) => String(n).padStart(2, "0");
const taken = `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())} ${pad(stamp.getHours())}:${pad(stamp.getMinutes())}`;
writeFileSync(shotsPath, `${JSON.stringify({ taken, screen: [POINTS, 874], themes, frames, sizes }, null, 2)}\n`);
console.log(`shots.json: ${stills.size} pictures, ${Object.keys(films).length} films`);
