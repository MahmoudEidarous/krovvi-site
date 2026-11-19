// The page in real iOS Safari, on a simulator that is already booted (Safari 26 once computed a CSS trick differently
// from Chrome and broke every phone on the live site: every layout change is looked at there before a push).
//   node scripts/look/safari.mjs <udid> <url> <outDir> [--at 0,700,1500] [--settle 1800] [--name ios] [--print "<expression>"]
// Drives Safari through safaridriver (WebDriver), moves the page in small steps as a finger would, and takes each
// picture off the simulator's own screen (a WebDriver picture can show stale tiles after a jump). Prints the page's
// size at each stop, whether it is wider than its window, and what the page's own error recorder caught.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const [udid, url, outDir] = args;
if (!udid || !url || !outDir) throw new Error("usage: node safari.mjs <udid> <url> <outDir> [--at ...]");
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const stops = String(opt("at", "0")).split(",").map(Number);
const settle = Number(opt("settle", 1800));
const name = opt("name", "ios");
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 4700 + Math.floor(Math.random() * 200);
const driver = spawn("safaridriver", ["-p", String(port)], { stdio: "ignore" });
const call = async (method, path, body) => {
  const r = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (j.value?.error) throw new Error(`${path}: ${j.value.message}`);
  return j.value;
};
let session = null;
try {
  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    try {
      await fetch(`http://127.0.0.1:${port}/status`);
      break;
    } catch {
      /* not up yet */
    }
  }
  const made = await call("POST", "/session", { capabilities: { alwaysMatch: { platformName: "iOS", browserName: "Safari", "safari:useSimulator": true, "safari:deviceUDID": udid } } });
  session = made.sessionId;
  const run = (script, a = []) => call("POST", `/session/${session}/execute/sync`, { script, args: a });
  await call("POST", `/session/${session}/url`, { url });
  await sleep(6000);
  // the page's errors from here on (the ones before this are in the first look's own console)
  await run("window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.message))); window.addEventListener('unhandledrejection', (e) => window.__errs.push('rejection: ' + String(e.reason)));");
  let n = 0;
  for (const y of stops) {
    const from = await run("return window.scrollY");
    const hops = Math.max(1, Math.min(30, Math.round(Math.abs(y - from) / 140)));
    for (let k = 1; k <= hops; k += 1) {
      await run("window.scrollTo(0, arguments[0])", [from + ((y - from) * k) / hops]);
      await sleep(24);
    }
    await sleep(settle);
    const size = await run("return [document.documentElement.scrollWidth, window.innerWidth, window.innerHeight, document.documentElement.scrollHeight, window.scrollY]");
    const file = join(outDir, `${name}-${String(n).padStart(2, "0")}-${y}.png`);
    execFileSync("xcrun", ["simctl", "io", udid, "screenshot", "--type=png", file], { stdio: "ignore" });
    console.log(`at ${y}: window ${size[1]} x ${size[2]}, page ${size[0]} wide${size[0] > size[1] ? " WIDER THAN ITS WINDOW" : ""}, ${size[3]} tall, stands at ${Math.round(size[4])}`);
    // --print "<expression>": what the page says at this stop
    if (opt("print", null)) console.log(`  ${JSON.stringify(await run(`return (${opt("print")})`))}`);
    n += 1;
  }
  const errs = await run("return window.__errs || []");
  console.log(errs.length ? `errors: ${errs.join(" | ")}` : "no errors");
} finally {
  if (session) await call("DELETE", `/session/${session}`).catch(() => {});
  driver.kill("SIGKILL");
}
