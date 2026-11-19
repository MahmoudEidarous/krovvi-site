// How smoothly the page scrolls: the whole page scrolled at a steady speed, every frame timed.
//   node scripts/look/perf.mjs <url> [--w 1440] [--h 900] [--mobile] [--speed 2400] [--dpr 2]
// Prints, for each part of the page, how many frames it drew and how many came late (more than one and a half frame
// times after the one before), with the worst gap. Chrome without a window draws at 60 frames a second, so this
// finds work that holds a frame up; how it feels at 120 on a real screen is judged on that screen.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const url = args[0];
if (!url) throw new Error("usage: node perf.mjs <url> [options]");
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const mobile = args.includes("--mobile");
const width = Number(opt("w", mobile ? 390 : 1440));
const height = Number(opt("h", mobile ? 760 : 900));
const dpr = Number(opt("dpr", 2));
const speed = Number(opt("speed", 2400));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "site-perf-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run", "--autoplay-policy=no-user-gesture-required", "--enable-gpu-rasterization", "about:blank"],
  { stdio: "ignore" }
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target = null;
  for (let i = 0; i < 60 && !target; i += 1) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page") ?? null;
    } catch {
      /* not up yet */
    }
  }
  if (!target) throw new Error("Chrome did not come up");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const waiting = new Map();
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(String(event.data));
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m);
      waiting.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      id += 1;
      waiting.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(6000);
  const script = `(async () => {
    const parts = ['top','friend','play','chat','apps','get','ft'].map((id) => ({ id, y: Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY) }));
    const total = document.documentElement.scrollHeight - innerHeight;
    const frames = [];
    let y = 0, last = 0;
    await new Promise((done) => {
      const step = (t) => {
        const dt = t - last;
        last = t;
        frames.push([y, dt]);
        y += ${speed} * dt / 1000;
        scrollTo(0, y);
        if (y < total) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame((t) => { last = t; requestAnimationFrame(step); });
    });
    const sorted = frames.map((f) => f[1]).sort((a, b) => a - b);
    const frame = sorted[Math.floor(sorted.length / 2)];
    const out = { frame: +frame.toFixed(2), frames: frames.length, parts: [] };
    for (let i = 0; i < parts.length; i++) {
      const from = parts[i].y, to = i + 1 < parts.length ? parts[i + 1].y : Infinity;
      const mine = frames.filter((f) => f[0] >= from && f[0] < to).map((f) => f[1]);
      out.parts.push({ part: parts[i].id, frames: mine.length, late: mine.filter((d) => d > frame * 1.5).length, worst: mine.length ? +Math.max(...mine).toFixed(1) : 0 });
    }
    return JSON.stringify(out);
  })()`;
  const r = await send("Runtime.evaluate", { expression: script, returnByValue: true, awaitPromise: true });
  const out = JSON.parse(r.result?.result?.value ?? "{}");
  console.log(`a frame every ${out.frame} ms; ${out.frames} frames in all`);
  for (const p of out.parts ?? []) console.log(`${p.part.padEnd(7)} ${String(p.frames).padStart(5)} frames, ${String(p.late).padStart(3)} late, worst ${p.worst} ms`);
  ws.close();
} finally {
  chrome.kill("SIGKILL");
  await sleep(200);
  rmSync(profile, { recursive: true, force: true });
}
