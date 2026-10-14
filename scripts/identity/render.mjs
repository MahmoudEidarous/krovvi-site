// Renders HTML pages to PNGs of exact size with one headless Chrome, over the DevTools protocol (Node's own
// WebSocket, no packages). One browser for every job, always closed at the end.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The browser: $CHROME, else the headless shell Puppeteer keeps, else Google Chrome. */
function browser() {
  if (process.env.CHROME) return process.env.CHROME;
  const shell = `${process.env.HOME}/.cache/puppeteer/chrome-headless-shell/mac_arm-147.0.7727.57/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
  return existsSync(shell) ? shell : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
}

/**
 * jobs: [{ url, width, height, scale = 1, out, transparent = false }]. Each page is shown at width x height CSS
 * pixels (times scale) and saved as a PNG once its fonts are in and two frames have been drawn.
 */
export async function render(jobs) {
  const profile = mkdtempSync(join(tmpdir(), "krovvi-render-"));
  const bin = browser();
  const chrome = spawn(bin, [
    // The headless shell is headless already; Google Chrome is told to be.
    ...(bin.includes("headless-shell") ? [] : ["--headless=new"]),
    `--user-data-dir=${profile}`,
    "--remote-debugging-port=0",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--allow-file-access-from-files",
    "about:blank",
  ], { stdio: "ignore" });
  const stop = () => {
    try { chrome.kill("SIGKILL"); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  };
  let ws;
  try {
    const portFile = join(profile, "DevToolsActivePort");
    for (let i = 0; i < 200 && !existsSync(portFile); i++) await new Promise((r) => setTimeout(r, 50));
    const [port, path] = readFileSync(portFile, "utf8").trim().split("\n");
    ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else for (const listener of listeners) listener(msg);
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
    });
    const next = (method, sessionId) => new Promise((resolve) => {
      const listener = (msg) => {
        if (msg.method === method && msg.sessionId === sessionId) { listeners.delete(listener); resolve(msg.params); }
      };
      listeners.add(listener);
    });
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    for (const job of jobs) {
      await send("Emulation.setDeviceMetricsOverride", { width: job.width, height: job.height, deviceScaleFactor: job.scale ?? 1, mobile: false }, sessionId);
      await send("Emulation.setDefaultBackgroundColorOverride", job.transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {}, sessionId);
      const loaded = next("Page.loadEventFired", sessionId);
      await send("Page.navigate", { url: job.url }, sessionId);
      await loaded;
      await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))", awaitPromise: true }, sessionId);
      const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: job.width, height: job.height, scale: 1 }, captureBeyondViewport: false }, sessionId);
      writeFileSync(job.out, Buffer.from(data, "base64"));
    }
    await send("Browser.close").catch(() => {});
  } finally {
    try { ws?.close(); } catch {}
    stop();
  }
}

/** One .ico from PNG frames (each entry holds its PNG as is, which every current browser and Windows read). */
export function writeIco(out, pngFiles) {
  const frames = pngFiles.map((file) => {
    const png = readFileSync(file);
    if (png.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
    return { png, width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  });
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = 6 + 16 * frames.length;
  const entries = frames.map(({ png, width, height }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  writeFileSync(out, Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]));
}
