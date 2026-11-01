// Krovvi Together's site library (together.ts), run with `npm test` (node --test; Node strips the types). Kept as
// .mjs so the site's type check and build leave it alone. together.ts imports nothing, so no resolve hook is needed.
import assert from "node:assert/strict";
import { test } from "node:test";

const T = await import("./together.ts");

const base = () =>
  T.normalizePost(
    {
      token: "tok_aaaaaaaaaaaaaaaaaaaa",
      kind: "episode",
      title: "The villa finds out",
      cover: { url: "https://x.test/c.jpg", w: 1024, h: 1024 },
      authorName: "Sara",
      cast: [{ name: "Sara", character: { name: "Sara Fragolina", lore: "collects mugs", image: null } }, { name: "Omar", character: null }],
      episode: { panels: [{ scene: "a villa", lines: [{ who: "Sara", says: "Who texted?" }] }], cliffhanger: "Omar runs", showTitle: "Villa", episodeNo: 3 },
      counts: { reactions: 2, comments: 1 },
      reactions: [
        { name: "Lina", kind: "haha" },
        { name: "Omar", kind: "dead" },
      ],
      comments: [{ name: "Lina", text: "I am crying", at: 1 }],
      mine: { reaction: null, answer: null },
      lang: "en",
    },
    "tok_aaaaaaaaaaaaaaaaaaaa"
  );

const plan = () =>
  T.normalizePost(
    {
      kind: "plan",
      title: "Dinner",
      authorName: "Sara",
      plan: {
        what: "Dinner this week?",
        options: [
          { id: "o1", label: "Thursday", at: "2026-11-05T20:00" },
          { id: "o2", label: "Friday" },
        ],
        answers: [{ name: "Omar", state: "in", picks: ["o1"] }],
        settled: null,
      },
      counts: { reactions: 0, comments: 0 },
      mine: { reaction: null, answer: null },
      lang: "en",
    },
    "tok_bbbbbbbbbbbbbbbbbbbb"
  );

test("a post is read whole, with every list a list", () => {
  const p = base();
  assert.equal(p.kind, "episode");
  assert.equal(p.cast.length, 2);
  assert.equal(p.cast[0].character.name, "Sara Fragolina");
  assert.equal(p.episode.episodeNo, 3);
  assert.deepEqual(p.mine, { reaction: null, answer: null });
});

test("what is not a post is null, and missing fields never break the page", () => {
  assert.equal(T.normalizePost(null, "x"), null);
  assert.equal(T.normalizePost({ kind: "story" }, "x"), null);
  const thin = T.normalizePost({ kind: "talk", talk: { lines: [{ side: "a", text: "hi" }, { side: "c", text: "no" }, { side: "b", text: "  " }] } }, "tok_cccccccccccccccccccc");
  assert.deepEqual(thin.reactions, []);
  assert.deepEqual(thin.comments, []);
  assert.equal(thin.talk.lines.length, 1);
  assert.equal(thin.talk.done, false);
  assert.equal(thin.token, "tok_cccccccccccccccccccc");
  assert.equal(thin.lang, "en");
});

test("a picture must be a real address; a settled option must be one of the options", () => {
  const p = T.normalizePost({ kind: "plan", cover: { url: "javascript:alert(1)", w: 1, h: 1 }, plan: { options: [{ id: "a", label: "A" }], settled: "zzz" } }, "t");
  assert.equal(p.cover, null);
  assert.equal(p.plan.settled, null);
});

test("a reaction lands at once, moves, and is taken back", () => {
  const p = base();
  const one = T.withReaction(p, "love", "Maya");
  assert.equal(one.mine.reaction, "love");
  assert.equal(one.counts.reactions, 3);
  assert.deepEqual(one.reactions[0], { name: "Maya", kind: "love" });
  const moved = T.withReaction(one, "wow", "Maya");
  assert.equal(moved.counts.reactions, 3);
  assert.equal(moved.reactions.filter((r) => r.name === "Maya").length, 1);
  assert.equal(moved.reactions[0].kind, "wow");
  const back = T.withReaction(moved, null, "Maya");
  assert.equal(back.mine.reaction, null);
  assert.equal(back.counts.reactions, 2);
  assert.equal(back.reactions.some((r) => r.name === "Maya"), false);
  // The page's own copy never changes the post it came from: a failed write puts that one back.
  assert.equal(p.reactions.length, 2);
});

test("a comment goes at the end and counts", () => {
  const p = T.withComment(base(), "Maya", "lol", 5);
  assert.equal(p.comments.at(-1).text, "lol");
  assert.equal(p.counts.comments, 2);
});

test("a plan answer replaces the visitor's last one, and can't keeps no picks", () => {
  const p = plan();
  const a = T.withAnswer(p, "Maya", "in", ["o1", "o2", "nope"]);
  assert.deepEqual(a.mine.answer, { state: "in", picks: ["o1", "o2"] });
  assert.equal(a.plan.answers.length, 2);
  const b = T.withAnswer(a, "Maya", "cant", ["o1"]);
  assert.equal(b.plan.answers.length, 2);
  assert.deepEqual(b.plan.answers.at(-1), { name: "Maya", state: "cant", picks: [] });
  assert.equal(T.withAnswer(base(), "Maya", "in", []).plan, undefined);
});

test("names and ids are cleaned the contract's way", () => {
  assert.equal(T.cleanName("  Lina   Mae  "), "Lina Mae");
  assert.equal(T.cleanName("x".repeat(50)).length, 30);
  assert.match(T.madeId(), T.TOKEN_RE);
  assert.equal(T.namesWords(["Sara", "Omar", "Lina"], "en"), "Sara, Omar and Lina");
  assert.equal(T.namesWords(["سارة", "عمر"], "ar"), "سارة وعمر");
});

test("links go where the contract says", () => {
  assert.ok(T.coverUrl("tok_aaaaaaaaaaaaaaaaaaaa").endsWith("/together?cover=tok_aaaaaaaaaaaaaaaaaaaa"));
  assert.ok(T.inviteCoverUrl("ABCD1234").endsWith("/together?invite_cover=ABCD1234"));
  assert.equal(T.appPostUrl("tok_aaaaaaaaaaaaaaaaaaaa"), "krovvi://together/post?token=tok_aaaaaaaaaaaaaaaaaaaa");
  assert.equal(T.appJoinUrl("ABCD1234"), "krovvi://together/join?code=ABCD1234");
});

test("reads refuse what is not a link without calling anyone", async () => {
  assert.deepEqual(await T.readPost("short"), { ok: false, off: true });
  assert.deepEqual(await T.readInvite("bad code!"), { ok: false, off: true });
});

test("a plan's moment reads as a day and a time", () => {
  assert.equal(T.momentWords("2026-11-05T20:00", "en"), "Thu 5 Nov, 8:00 PM");
  assert.equal(T.momentWords("2026-11-05", "en"), "Thu 5 Nov");
  assert.equal(T.momentWords(undefined, "en"), "");
});

test("a name the edge function would refuse is never kept, and an inviter with no name is a friend (review, 2 November 2026)", () => {
  assert.equal(T.cleanName("  Nour  "), "Nour");
  assert.equal(T.cleanName("@lina"), "");
  assert.equal(T.cleanName("www.me.com"), "");
  assert.equal(T.cleanName("N".repeat(40)).length, 30);
  const invite = T.normalizeInvite({ code: "abcd1234", name: "", character: null, valid: true }, "abcd1234");
  assert.ok(invite, "kept, not turned into a link that is off");
  assert.equal(T.inviterName(invite.name, "en"), "A friend");
  assert.equal(T.inviterName(invite.name, "en", false), "your friend");
  assert.equal(T.inviterName(invite.name, "ar"), "صاحبك");
  assert.equal(T.inviterName("Sara", "en"), "Sara");
});
