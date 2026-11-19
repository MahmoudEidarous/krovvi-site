// Pictures of a page at a true size, through Chrome's own DevTools protocol (no package).
//   node scripts/look/shoot.mjs <url> <outDir> [--w 1440] [--h 900] [--mobile] [--dpr 2] [--wait 2500]
//        [--at 0,800,1600 | --step 700] [--settle 900] [--full] [--name live] [--print "<expression>"]
// --at: scroll positions to stop at (px); --step: every N px to the end; --full: one tall picture too.
// Prints the page's height, whether it is wider than its window, and any console or page errors.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const [url, outDir] = args;
if (!url || !outDir) throw new Error("usage: node shoot.mjs <url> <outDir> [options]");
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);
const mobile = has("mobile");
const width = Number(opt("w", mobile ? 390 : 1440));
const height = Number(opt("h", mobile ? 844 : 900));
const dpr = Number(opt("dpr", 2));
const wait = Number(opt("wait", 2500));
const settle = Number(opt("settle", 900));
const name = opt("name", mobile ? "m" : "d");
const run = opt("eval", "");
mkdirSync(outDir, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "site-shoot-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run", "--autoplay-policy=no-user-gesture-required", "about:blank"],
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
  const errors = [];
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(String(event.data));
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m);
      waiting.delete(m.id);
    } else if (m.method === "Runtime.exceptionThrown") {
      errors.push(`page error: ${m.params?.exceptionDetails?.exception?.description ?? m.params?.exceptionDetails?.text}`);
    } else if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error") {
      errors.push(`console error: ${(m.params.args ?? []).map((a) => a.value ?? a.description ?? "").join(" ")}`);
    } else if (m.method === "Network.loadingFailed" && !m.params?.canceled) {
      errors.push(`failed request: ${m.params?.errorText}`);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      id += 1;
      waiting.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  if (mobile) {
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1" });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  }
  if (has("reduce")) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(wait);
  if (run) await evaluate(run);
  const size = JSON.parse(await evaluate("JSON.stringify({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: window.innerWidth })"));
  console.log(`page ${size.vw} wide, ${size.h} tall${size.w > size.vw ? `, WIDER THAN ITS WINDOW by ${size.w - size.vw}` : ""}`);
  let stops = [];
  if (opt("at", null)) stops = String(opt("at")).split(",").map(Number);
  else if (opt("step", null)) for (let y = 0; y < size.h - height + Number(opt("step")); y += Number(opt("step"))) stops.push(Math.min(y, Math.max(0, size.h - height)));
  else stops = [0];
  let n = 0;
  for (const y of [...new Set(stops)]) {
    // The page is moved the way a hand moves it, in small steps, so scroll-driven parts pass through every state.
    const from = Number(await evaluate("window.scrollY"));
    const hops = Math.max(1, Math.min(40, Math.round(Math.abs(y - from) / 120)));
    for (let k = 1; k <= hops; k += 1) {
      await evaluate(`window.scrollTo(0, ${from + ((y - from) * k) / hops})`);
      await sleep(16);
    }
    await sleep(settle);
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
    const file = join(outDir, `${name}-${String(n).padStart(2, "0")}-${y}.jpg`);
    writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    n += 1;
    // --print "<expression>": what the page says at this stop (a size, a class, a computed style)
    if (opt("print", null)) console.log(`at ${y}: ${await evaluate(`JSON.stringify(${opt("print")})`)}`);
  }
  if (has("full")) {
    await evaluate("window.scrollTo(0, 0)");
    await sleep(300);
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(size.h, 16000), scale: 0.5 } });
    writeFileSync(join(outDir, `${name}-full.jpg`), Buffer.from(shot.result.data, "base64"));
  }
  console.log(`${n} pictures in ${outDir}`);
  if (errors.length) console.log(errors.slice(0, 12).join("\n"));
  else console.log("no errors");
  ws.close();
} finally {
  chrome.kill("SIGKILL");
  await sleep(200);
  rmSync(profile, { recursive: true, force: true });
}
