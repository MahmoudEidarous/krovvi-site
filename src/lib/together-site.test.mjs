import assert from "node:assert/strict";
import { test } from "node:test";

import { siteHeaders, SITE_FOR_HEADER, SITE_KEY_HEADER } from "./together-site.ts";

// The site's own reads of a Together post (lib/together-site.ts, 2 November 2026): its key and the visitor's address
// go only when the key is set, so the edge function counts each visitor and never believes an address without it.
const h = (o) => ({ get: (n) => o[n.toLowerCase()] ?? null });

test("sends nothing without the site's key", () => {
  assert.deepEqual(siteHeaders(h({ "x-real-ip": "203.0.113.7" }), ""), {});
  assert.deepEqual(siteHeaders(h({ "x-real-ip": "203.0.113.7" }), undefined), {});
});

test("sends the key and the visitor's address as Vercel wrote it", () => {
  assert.deepEqual(siteHeaders(h({ "x-real-ip": "203.0.113.7" }), "k".repeat(40)), { [SITE_KEY_HEADER]: "k".repeat(40), [SITE_FOR_HEADER]: "203.0.113.7" });
  assert.deepEqual(siteHeaders(h({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }), "key-key-key"), { [SITE_KEY_HEADER]: "key-key-key", [SITE_FOR_HEADER]: "198.51.100.4" });
});

test("sends the key alone when no address came", () => {
  assert.deepEqual(siteHeaders(h({}), "key-key-key"), { [SITE_KEY_HEADER]: "key-key-key" });
});
