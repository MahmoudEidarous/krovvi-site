/**
 * Every Together page state with no server, while building (src/app/e/dev and src/app/k/dev, which answer only when
 * NODE_ENV is development and are never in a production build): an episode in English and in Arabic, a live talk
 * and a finished one, a plan with answers and a settled one, a character, an invite, one that ran out, and links that
 * are off.
 *
 * The pictures are hand-drawn SVG stand-ins for what the picture model makes (flat little characters and a four
 * panel episode), as data URIs, so nothing is fetched and nothing is paid for. Names and lines are general examples.
 */

import type { InviteRead, Lang, PostRead, WebCharacter, WebPostView } from "@/lib/together";

/* ── The stand-in pictures ─────────────────────────────────────────────── */

const svgUrl = (body: string, w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`)}`;

const INKY = "#2B1B17";
const eyes = (y: number, gap = 32, r = 6.5) =>
  `<circle cx="${100 - gap / 2}" cy="${y}" r="${r}" fill="${INKY}"/><circle cx="${100 + gap / 2}" cy="${y}" r="${r}" fill="${INKY}"/><circle cx="${100 - gap / 2 + 2}" cy="${y - 2.2}" r="2.2" fill="#fff"/><circle cx="${100 + gap / 2 + 2}" cy="${y - 2.2}" r="2.2" fill="#fff"/>`;
const smile = (y: number, w = 11) => `<path d="M${100 - w} ${y} Q100 ${y + 10} ${100 + w} ${y}" stroke="${INKY}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
const cheeks = (y: number, gap = 54) => `<ellipse cx="${100 - gap / 2}" cy="${y}" rx="8" ry="4.5" fill="#FF8A8A" opacity=".65"/><ellipse cx="${100 + gap / 2}" cy="${y}" rx="8" ry="4.5" fill="#FF8A8A" opacity=".65"/>`;

/** Sara, a strawberry with a mug she will never use. Drawn in a 200 square. */
function strawberry(): string {
  const seeds = [
    [70, 96], [92, 88], [114, 90], [134, 100], [62, 120], [138, 124], [80, 146], [120, 146], [100, 158],
  ]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="4.2" fill="#FFD98A"/>`)
    .join("");
  return `<path d="M100 178C58 168 34 128 40 96C46 70 72 62 100 66C128 62 154 70 160 96C166 128 142 168 100 178Z" fill="#E5484D"/>${seeds}<path d="M100 70L78 52l18 7 4-20 4 20 18-7z" fill="#3FA34D"/><path d="M100 40v-8" stroke="#2F7A39" stroke-width="5" stroke-linecap="round"/>${eyes(114)}${cheeks(130, 60)}${smile(132, 10)}<rect x="146" y="128" width="26" height="28" rx="5" fill="#F4F1EA" stroke="${INKY}" stroke-width="3"/><path d="M172 134c9 0 9 16 0 16" stroke="${INKY}" stroke-width="3" fill="none"/>`;
}

/** Omar, a toaster with toast that keeps popping. */
function toaster(): string {
  return `<rect x="58" y="34" width="34" height="34" rx="8" fill="#E9B872"/><rect x="104" y="40" width="34" height="30" rx="8" fill="#E9B872"/><rect x="40" y="62" width="120" height="104" rx="26" fill="#C9CED6"/><rect x="40" y="62" width="120" height="22" rx="11" fill="#B2B8C2"/><rect x="56" y="66" width="38" height="8" rx="4" fill="#5A6170"/><rect x="104" y="66" width="38" height="8" rx="4" fill="#5A6170"/>${eyes(112, 36)}${cheeks(128, 64)}${smile(130, 12)}<rect x="160" y="100" width="10" height="26" rx="5" fill="#8E95A3"/><rect x="62" y="166" width="12" height="12" rx="4" fill="#8E95A3"/><rect x="126" y="166" width="12" height="12" rx="4" fill="#8E95A3"/>`;
}

/** Lina, a sleepy croissant. */
function croissant(): string {
  return `<path d="M30 132C40 84 76 64 100 64s60 20 70 68c-12 10-30 4-38-6-8 14-56 14-64 0-8 10-26 16-38 6z" fill="#E7A24A"/><path d="M68 78c6 18 6 40 2 56M100 66v64M132 78c-6 18-6 40-2 56" stroke="#B9732B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M76 104q8 6 16 0M108 104q8 6 16 0" stroke="${INKY}" stroke-width="4.5" fill="none" stroke-linecap="round"/>${cheeks(116, 70)}<path d="M93 120q7 5 14 0" stroke="${INKY}" stroke-width="4" fill="none" stroke-linecap="round"/><text x="150" y="60" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="22" font-weight="700" fill="#6B5B95">z</text><text x="164" y="44" font-family="Chalkboard SE, Comic Sans MS, sans-serif" font-size="16" font-weight="700" fill="#6B5B95">z</text>`;
}

/** Maya, a cactus in sunglasses. */
function cactus(): string {
  return `<path d="M60 150h80l-8 32H68z" fill="#C8734A"/><rect x="54" y="140" width="92" height="16" rx="6" fill="#D98B5F"/><rect x="78" y="44" width="44" height="104" rx="22" fill="#5DB36A"/><path d="M78 104H62a12 12 0 0 1-12-12V76a8 8 0 0 1 16 0v14h12M122 92h16V70a8 8 0 0 1 16 0v26a12 12 0 0 1-12 12h-20" fill="#5DB36A"/><rect x="80" y="78" width="18" height="12" rx="5" fill="${INKY}"/><rect x="102" y="78" width="18" height="12" rx="5" fill="${INKY}"/><path d="M98 83h4" stroke="${INKY}" stroke-width="3"/>${smile(104, 9)}`;
}

const DRAW = { strawberry, toaster, croissant, cactus } as const;
type Who = keyof typeof DRAW;
const GROUND: Record<Who, string> = { strawberry: "#F7E1D7", toaster: "#DCE6F2", croissant: "#F5E6C8", cactus: "#E1F0DC" };

function portrait(who: Who): string {
  return svgUrl(`<rect width="200" height="200" fill="${GROUND[who]}"/><circle cx="100" cy="190" r="90" fill="#fff" opacity=".35"/>${DRAW[who]()}`, 200, 200);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A speech bubble, words wrapped by hand to the bubble. */
function bubble(x: number, y: number, w: number, lines: string[], rtl: boolean, tail: "left" | "right"): string {
  const h = 26 + lines.length * 34;
  const tx = tail === "left" ? x + 46 : x + w - 46;
  const text = lines
    .map((l, i) => `<text x="${rtl ? x + w - 22 : x + 22}" y="${y + 42 + i * 34}" font-family="Chalkboard SE, Comic Sans MS, Geeza Pro, sans-serif" font-size="27" font-weight="700" fill="${INKY}" ${rtl ? 'direction="rtl" text-anchor="start"' : ""}>${esc(l)}</text>`)
    .join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#fff" stroke="${INKY}" stroke-width="4"/><path d="M${tx - 14} ${y + h - 2}l${tail === "left" ? -10 : 10} 30 ${tail === "left" ? 30 : -30}-30" fill="#fff" stroke="${INKY}" stroke-width="4" stroke-linejoin="round"/><rect x="${tx - 16}" y="${y + h - 6}" width="32" height="8" fill="#fff"/>${text}`;
}

/** One panel, 512 square at (px, py): a scene's ground, two characters and who speaks. */
function panel(px: number, py: number, ground: string, cast: [Who, Who], speaker: 0 | 1, lines: string[], rtl: boolean, extra = ""): string {
  const [a, b] = cast;
  return `<g transform="translate(${px} ${py})"><rect width="512" height="512" fill="${ground}"/><rect y="372" width="512" height="140" fill="#000" opacity=".06"/>${extra}<g transform="translate(18 222) scale(1.28)">${DRAW[a]()}</g><g transform="translate(250 222) scale(1.28)">${DRAW[b]()}</g>${bubble(speaker === 0 ? 26 : 120, 26, 366, lines, rtl, speaker === 0 ? "left" : "right")}<rect width="512" height="512" fill="none" stroke="${INKY}" stroke-width="10"/></g>`;
}

function episodePicture(lines: [string[], string[], string[], string[]], rtl: boolean): string {
  const moon = `<circle cx="440" cy="300" r="26" fill="#FFF3C4" opacity=".9"/>`;
  return svgUrl(
    `<rect width="1024" height="1024" fill="${INKY}"/>` +
      panel(0, 0, "#3B3A6B", ["strawberry", "toaster"], 0, lines[0], rtl, moon) +
      panel(512, 0, "#3B3A6B", ["strawberry", "toaster"], 1, lines[1], rtl, moon) +
      panel(0, 512, "#54407A", ["croissant", "toaster"], 0, lines[2], rtl) +
      panel(512, 512, "#54407A", ["croissant", "toaster"], 1, lines[3], rtl, `<circle cx="372" cy="300" r="5" fill="#E9B872"/><circle cx="392" cy="318" r="4" fill="#E9B872"/><circle cx="356" cy="322" r="3.5" fill="#E9B872"/>`),
    1024,
    1024
  );
}

const pic = (url: string, w = 200, h = 200) => ({ url, w, h });

/* ── The cast ──────────────────────────────────────────────────────────── */

const CHARS: Record<string, WebCharacter> = {
  sara: { name: "Sara Fragolina", lore: "collects mugs she will never use", image: pic(portrait("strawberry")) },
  omar: { name: "Omar the Toaster", lore: "has opinions about bread and shares all of them", image: pic(portrait("toaster")) },
  lina: { name: "Lina Croissant", lore: "fell asleep in the group photo, twice", image: pic(portrait("croissant")) },
  maya: { name: "Maya Cactus", lore: "waters everyone else’s plants and forgets her own", image: pic(portrait("cactus")) },
};

const CHARS_AR: Record<string, WebCharacter> = {
  sara: { name: "سارة الفراولاية", lore: "بتجمع مجات عمرها ما هتستخدمها", image: pic(portrait("strawberry")) },
  omar: { name: "عمر التوستر", lore: "عنده رأي في كل نوع عيش وبيقوله", image: pic(portrait("toaster")) },
  lina: { name: "لينا الكرواسون", lore: "نامت في صورة الجروب مرتين", image: pic(portrait("croissant")) },
};

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 1, 18, 0);
const none = { reaction: null, answer: null } as WebPostView["mine"];

function post(p: Partial<WebPostView> & Pick<WebPostView, "token" | "kind" | "title">): WebPostView {
  return { cover: null, authorName: "Sara", cast: [], counts: { reactions: 0, comments: 0 }, reactions: [], comments: [], mine: none, lang: "en", ...p };
}

const ok = (p: WebPostView): PostRead => ({ ok: true, post: p });

const EPISODE_LINES: [string[], string[], string[], string[]] = [
  ["Who keeps texting", "at dinner?"],
  ["Not me. I'm a", "toaster. No thumbs."],
  ["Then why is your", "screen glowing?"],
  ["...that's just", "the crumbs."],
];
const EPISODE_LINES_AR: [string[], string[], string[], string[]] = [
  ["مين بيبعت رسايل", "على العشا؟"],
  ["مش أنا. أنا توستر.", "معنديش صوابع."],
  ["أمال الشاشة", "منورة ليه؟"],
  ["ده... فتافيت", "العيش بس."],
];

const episode = post({
  token: "dev_episode_aaaaaaaaaaaa",
  kind: "episode",
  title: "Someone is texting at dinner",
  cover: pic(episodePicture(EPISODE_LINES, false), 1024, 1024),
  cast: [
    { name: "Sara", character: CHARS.sara },
    { name: "Omar", character: CHARS.omar },
    { name: "Lina", character: CHARS.lina },
  ],
  episode: {
    showTitle: "Breakfast Island",
    episodeNo: 3,
    cliffhanger: "Next episode: Sara finds out who Croissant Girl really is.",
    panels: EPISODE_LINES.map((l, i) => ({ scene: ["Dinner at the villa", "Omar steams", "Lina leans in", "Crumbs everywhere"][i], lines: [{ who: ["Sara", "Omar", "Lina", "Omar"][i], says: l.join(" ") }] })),
  },
  counts: { reactions: 6, comments: 3 },
  reactions: [
    { name: "Lina", kind: "dead" },
    { name: "Omar", kind: "haha" },
    { name: "Maya", kind: "haha" },
    { name: "Sam", kind: "love" },
  ],
  comments: [
    { name: "Lina", text: "Omar the Toaster is sending me", at: NOW - 3 * HOUR },
    { name: "Omar", text: "I want a lawyer. A toaster lawyer.", at: NOW - 2 * HOUR },
    { name: "Maya", text: "Episode 4 when", at: NOW - 20 * 60_000 },
  ],
});

const episodeAr = post({
  token: "dev_episode_ar_aaaaaaaaa",
  kind: "episode",
  title: "مين بيبعت رسايل على العشا؟",
  authorName: "سارة",
  cover: pic(episodePicture(EPISODE_LINES_AR, true), 1024, 1024),
  cast: [
    { name: "سارة", character: CHARS_AR.sara },
    { name: "عمر", character: CHARS_AR.omar },
    { name: "لينا", character: CHARS_AR.lina },
  ],
  episode: {
    showTitle: "جزيرة الفطار",
    episodeNo: 3,
    cliffhanger: "الحلقة الجاية: سارة تعرف مين هي بنت الكرواسون بجد.",
    panels: EPISODE_LINES_AR.map((l, i) => ({ scene: "", lines: [{ who: ["سارة", "عمر", "لينا", "عمر"][i], says: l.join(" ") }] })),
  },
  counts: { reactions: 3, comments: 2 },
  reactions: [
    { name: "لينا", kind: "dead" },
    { name: "عمر", kind: "haha" },
    { name: "Sam", kind: "haha" },
  ],
  comments: [
    { name: "لينا", text: "عمر التوستر موتني", at: NOW - 2 * HOUR },
    { name: "Sam", text: "this is the best one yet", at: NOW - 30 * 60_000 },
  ],
  lang: "ar",
});

const TALK_LINES: { side: "a" | "b"; text: string }[] = [
  { side: "a", text: "Sara once answered a voice note eleven days later. With a thumbs up. I was there." },
  { side: "b", text: "Omar reads every message, answers it in his head, and never sends anything. He thinks that counts." },
  { side: "a", text: "Bold, from a man whose phone has been on two percent since March." },
  { side: "b", text: "At least he picks up. Sara lets it ring, then texts “call?” ten minutes later." },
  { side: "a", text: "That is called manners. Nobody calls without a warning text." },
  { side: "b", text: "Fine. Omar would like it noted that he did warn you. In 2024." },
  { side: "a", text: "Final answer: you are both terrible, and you both answered this talk in under a second." },
  { side: "b", text: "Agreed. Same time next week? We will not hear back from either of them." },
];

const talkBase = {
  kind: "talk" as const,
  title: "Roast battle: who replies slower",
  cast: [
    { name: "Sara", character: CHARS.sara },
    { name: "Omar", character: CHARS.omar },
  ],
};

const talkDone = post({
  ...talkBase,
  token: "dev_talk_done_aaaaaaaaaa",
  talk: { topic: "Roast battle: who replies slower", a: "Sara", b: "Omar", lines: TALK_LINES, done: true },
  counts: { reactions: 4, comments: 1 },
  reactions: [
    { name: "Lina", kind: "dead" },
    { name: "Maya", kind: "dead" },
    { name: "Sam", kind: "haha" },
  ],
  comments: [{ name: "Lina", text: "two percent since March is so true", at: NOW - 40 * 60_000 }],
});

const talkLive = post({
  ...talkBase,
  token: "dev_talk_live_aaaaaaaaaa",
  talk: { topic: "Roast battle: who replies slower", a: "Sara", b: "Omar", lines: TALK_LINES.slice(0, 3), done: false },
});

const OPTIONS = [
  { id: "o1", label: "Thursday dinner", at: "2026-11-05T20:00", place: "The noodle bar" },
  { id: "o2", label: "Friday", at: "2026-11-06T19:30", place: "Sara’s place" },
  { id: "o3", label: "Saturday lunch", at: "2026-11-07T13:00" },
];

const plan = post({
  token: "dev_plan_aaaaaaaaaaaaaaa",
  kind: "plan",
  title: "Dinner this week?",
  plan: {
    what: "Dinner this week?",
    options: OPTIONS,
    answers: [
      { name: "Omar", state: "in", picks: ["o1", "o2"] },
      { name: "Lina", state: "maybe", picks: ["o2"] },
      { name: "Maya", state: "cant", picks: [] },
    ],
    settled: null,
  },
  counts: { reactions: 1, comments: 1 },
  reactions: [{ name: "Omar", kind: "love" }],
  comments: [{ name: "Lina", text: "Friday works if we start late", at: NOW - HOUR }],
});

const planSettled = post({
  ...plan,
  token: "dev_plan_settled_aaaaaaa",
  plan: { ...plan.plan!, settled: "o1", answers: [...plan.plan!.answers, { name: "Sam", state: "in", picks: ["o1"] }] },
  mine: { reaction: null, answer: { state: "in", picks: ["o1"] } },
});

const character = post({
  token: "dev_character_aaaaaaaaaa",
  kind: "character",
  title: "Meet Sara Fragolina",
  cover: pic(portrait("strawberry"), 200, 200),
  cast: [{ name: "Sara", character: CHARS.sara }],
  character: { name: CHARS.sara.name, lore: CHARS.sara.lore },
  counts: { reactions: 2, comments: 0 },
  reactions: [
    { name: "Omar", kind: "haha" },
    { name: "Lina", kind: "love" },
  ],
});

export interface PostFixtureEntry {
  label: string;
  read: PostRead;
  /** A live talk's next lines, played by the page one by one. */
  more?: { side: "a" | "b"; text: string }[];
}

export const POST_FIXTURES: Record<string, PostFixtureEntry> = {
  episode: { label: "An episode", read: ok(episode) },
  "episode-ar": { label: "An episode in Arabic", read: ok(episodeAr) },
  "talk-live": { label: "A live talk", read: ok(talkLive), more: TALK_LINES.slice(3, 6) },
  "talk-done": { label: "A finished talk", read: ok(talkDone) },
  plan: { label: "A plan with answers", read: ok(plan) },
  "plan-settled": { label: "A settled plan, answered", read: ok(planSettled) },
  character: { label: "A character", read: ok(character) },
  off: { label: "A link that is off", read: { ok: false, off: true } },
};

export const INVITE_FIXTURES: Record<string, { label: string; read: InviteRead; lang: Lang }> = {
  invite: { label: "An invite", read: { ok: true, invite: { code: "DEVCODE1", name: "Sara", character: CHARS.sara, valid: true } }, lang: "en" },
  "invite-ar": { label: "An invite in Arabic", read: { ok: true, invite: { code: "DEVCODE2", name: "سارة", character: CHARS_AR.sara, valid: true } }, lang: "ar" },
  "no-character": { label: "An invite with no character yet", read: { ok: true, invite: { code: "DEVCODE3", name: "Omar", character: null, valid: true } }, lang: "en" },
  "ran-out": { label: "An invite that ran out", read: { ok: true, invite: { code: "DEVCODE4", name: "Sara", character: CHARS.sara, valid: false } }, lang: "en" },
  off: { label: "A code that is off", read: { ok: false, off: true }, lang: "en" },
};
