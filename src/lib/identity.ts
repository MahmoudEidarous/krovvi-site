import type { Metadata } from "next";

import { SUPPORT_EMAIL } from "./site";

/**
 * Krovvi's identity: every word and fact a person, a search engine, a chat app
 * or an AI assistant reads about Krovvi before they open the page. The root
 * layout's metadata, the structured data, the manifest, the sitemap, robots.txt,
 * /llms.txt and the pages' own titles all read from here, so a word changes in
 * one place.
 *
 * Two copies live outside this file because Next reads them as plain files:
 * src/app/opengraph-image.alt.txt and src/app/twitter-image.alt.txt hold
 * SHARE_IMAGE_ALT, and src/lib/identity.test.mjs fails when they drift.
 *
 * Rules for every line here (the owner's): no em dashes, plain words, nothing
 * the product does not do, no pricing, no ratings, no invented numbers.
 */

/** The one address of the site. www lands here (next.config.ts). */
export const SITE_URL = "https://krovvi.com";

export interface Identity {
  /** The name, as a sentence writes it. */
  name: string;
  /** The wordmark as drawn: lowercase, system semibold. */
  wordmark: string;
  domain: string;
  /** The home page, as structured data names it (Google's examples end in a slash). */
  url: string;
  /**
   * Google's site name, second choice. Google's site-names page suggests the bare
   * domain, all lowercase, as the backup when it is not sure of the name.
   */
  alternateName: string;
  /** The page's big line, also the share image's line. */
  tagline: string;
  /** The home page's <title>: the title link Google shows. */
  title: string;
  /** Every other page's <title>: the page first, the name last (Google: "a delimiter such as a hyphen, colon, or pipe"). */
  titleTemplate: string;
  /** The meta description: the snippet Google may show under the title. */
  description: string;
  /** What a chat app shows under the link to the home page. */
  ogTitle: string;
  ogDescription: string;
  /** One line that says what kind of thing Krovvi is. */
  category: string;
  /** Why Krovvi exists: the about text, the Organization's description and /llms.txt. */
  mission: string;
  /** Where Krovvi is today. */
  status: string;
  /** Where people reach us (src/lib/site.ts). */
  email: string;
  /** The founder's name for the Organization's structured data. Empty: left out. */
  founder: string;
  /** Krovvi's own profiles elsewhere (LinkedIn, X, the App Store once public). Empty: left out. */
  sameAs: string[];
  /** Who makes Krovvi, as the privacy policy says it ("Krovvi is made by Delvnco"). Not in the structured data yet. */
  maker: string;
  locale: string;
  /** The app, for the MobileApplication structured data. */
  app: {
    operatingSystem: string;
    device: string;
    /** One of Google's supported app types (its list has no "Productivity"). */
    category: string;
  };
  colors: {
    /** The sky's black: theme color and manifest background. */
    sky: string;
    /** The app icon's tile (catch8 brand/icon-1024.svg). */
    tile: string;
    /** The dots and the type. */
    ink: string;
  };
  /** The square K on black, 512 px: the Organization's logo and the manifest's large icon. */
  logo: { path: string; size: number };
}

export const IDENTITY: Identity = {
  name: "Krovvi",
  wordmark: "krovvi",
  domain: "krovvi.com",
  url: `${SITE_URL}/`,
  alternateName: "krovvi.com",

  // The lead's draft words, 14 October 2026 (option A of each in
  // design/krovvi-identity-2026-10-14, where the owner picks). Options there:
  //   tagline B: "An AI that already knows what's going on."
  //   tagline C: "The AI friend that knows your life."
  //   description B: "Krovvi is an AI friend on iPhone. It knows the people in your life, writes first when something matters, and gets things done."
  //   description C: "Every AI starts from zero. Krovvi starts from your life: it remembers your people and plans, and talks first when something matters."
  //   mission B: "No one should have to keep their whole life in their head."
  //   mission C: "Make AI that knows you, so you never start from zero."
  tagline: "The AI that knows your life.",
  title: "Krovvi: the AI that knows your life",
  description:
    "Krovvi is a personal AI on iPhone that remembers your people and plans, talks first when something matters, and gets things done for you.",
  ogTitle: "Krovvi: the AI that knows your life",
  ogDescription: "It remembers your people and your plans, talks first when something matters, and gets things done.",
  category: "Personal AI for iPhone",
  mission: "Give everyone an AI that keeps up with their life.",
  status: "In beta on iPhone",
  // End of the lead's draft words.

  titleTemplate: "%s | Krovvi",
  email: SUPPORT_EMAIL,
  founder: "", // owner to confirm
  sameAs: [], // owner to give profile links
  maker: "Delvnco", // from the privacy policy; owner to confirm the legal name before it goes in as legalName
  locale: "en_US",
  app: { operatingSystem: "iOS", device: "iPhone", category: "LifestyleApplication" }, // owner to confirm against App Store Connect
  colors: { sky: "#010101", tile: "#0A0A0A", ink: "#EDEDEB" },
  logo: { path: "/brand/krovvi-512.png", size: 512 },
};

/** The share image's alt text (the two .alt.txt files in src/app hold the same words). */
export const SHARE_IMAGE_ALT = "The Krovvi K, eleven ivory dots on a night sky, with the words: The AI that knows your life.";

/** A page people can find: in the sitemap, in /llms.txt, and with its own title and description. */
export interface SitePage {
  path: string;
  /** Its <title> before the template: "Privacy Policy" becomes "Privacy Policy | Krovvi". The home's is IDENTITY.title. */
  title: string;
  description: string;
}

export const PAGES: readonly SitePage[] = [
  { path: "/", title: IDENTITY.title, description: IDENTITY.description },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "What Krovvi keeps, where it is kept, who handles it for us, and how you can delete it.",
  },
  {
    path: "/support",
    title: "Support",
    description: "Something broken, confusing or missing in Krovvi? Email us and we will fix it.",
  },
];

/** The page whose path is given (a typo is a build error, not a missing page). */
export function page(path: "/" | "/privacy" | "/support"): SitePage {
  const found = PAGES.find((p) => p.path === path);
  if (!found) throw new Error(`No page ${path} in identity.ts`);
  return found;
}

/**
 * A page's own metadata (not the home's): its title through the template, its
 * description, and a link preview in its own words. Setting openGraph here
 * leaves out the site's big picture, so a chat app shows the small K beside
 * the title: the big picture is the home's.
 */
export function subpageMetadata(path: "/privacy" | "/support"): Metadata {
  const { title, description } = page(path);
  return {
    title,
    description,
    openGraph: { type: "website", url: "./", siteName: IDENTITY.name, locale: IDENTITY.locale, title, description },
    twitter: { card: "summary", title, description },
  };
}

/** An absolute address on the site, as structured data and the sitemap want it. */
export function absolute(path: string): string {
  return path === "/" ? IDENTITY.url : `${SITE_URL}${path}`;
}

/**
 * What /llms.txt says (llmstxt.org: a name, a one line summary, then plain
 * sections). H3's draft from the shared brief's "What Krovvi is now"; the lead
 * edits it here. Only what the app does today, or ships this week.
 */
export const ABOUT = {
  /** Who it is for. */
  audience:
    "People with a busy life who want an AI that already knows what is going on: their people, their plans, what changed, so they do not have to explain it again each time.",
  /** What it does, one plain line each. */
  does: [
    "You open the app straight into a chat with Krovvi. The chat is home.",
    "It remembers your people, your plans and what changed, from what you tell it. The longer you use it, the less you explain.",
    "It talks first when something matters: before a meeting, after a hard day, when a promise is due or a date is near.",
    "You can send it anything: talk, type, a voice note, a photo, a file, a link, or share from any app.",
    "In one reply it can use what it knows, search the web, read your mail and calendar if you connect them, and make things for you, such as files, plans and lists.",
    "It keeps a home screen of apps for you, filled from what you say: Library, Recording, Meetings, Nutrition, Money, To-do, Fitness, Habits, Kitchen, Health, Plans, Trips and Watch.",
    "You can share a chat with a link. The other person reads it without an account and can carry it on in their own Krovvi.",
    "It is honest: it says it is an AI, and when you ask how it knows something, it tells you.",
  ],
  /** From the privacy policy, word for word. */
  privacy: "We never sell your data. Krovvi has no ads. We do not use your data to train AI models.",
  /** How to get in, before the address. */
  join: "Krovvi is in beta on iPhone. To join, email",
} as const;

/** /llms.txt, built from the words above. */
export function llmsText(): string {
  const lines = [
    `# ${IDENTITY.name}`,
    "",
    `> ${IDENTITY.description}`,
    "",
    `- What it is: ${IDENTITY.category}`,
    `- Status: ${IDENTITY.status}`,
    `- Mission: ${IDENTITY.mission}`,
    `- Website: ${IDENTITY.url}`,
    "",
    "## Who it is for",
    "",
    ABOUT.audience,
    "",
    "## What it does",
    "",
    ...ABOUT.does.map((line) => `- ${line}`),
    "",
    "## How to join",
    "",
    `${ABOUT.join} ${IDENTITY.email} and ask for an invite. Questions and support go to the same address.`,
    "",
    "## Privacy",
    "",
    `${ABOUT.privacy} The full policy: ${absolute("/privacy")}`,
    "",
    "## Pages",
    "",
    ...PAGES.map((p) => `- [${p.path === "/" ? "Home" : p.title}](${absolute(p.path)}): ${p.description}`),
    "",
  ];
  return lines.join("\n");
}

/**
 * The structured data (schema.org JSON-LD) for the root layout's head: the site,
 * the company and the app, linked by @id. Google reads the WebSite node for the
 * site name and the Organization node for the logo. No price and no rating:
 * Krovvi has neither, so no app rich result is possible, and none is wanted.
 */
export function structuredData(): Record<string, unknown> {
  const org = `${SITE_URL}/#organization`;
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": org,
    name: IDENTITY.name,
    alternateName: IDENTITY.alternateName,
    url: IDENTITY.url,
    logo: {
      "@type": "ImageObject",
      url: absolute(IDENTITY.logo.path),
      width: IDENTITY.logo.size,
      height: IDENTITY.logo.size,
    },
    description: IDENTITY.mission,
    slogan: IDENTITY.tagline,
    email: IDENTITY.email,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: IDENTITY.email },
  };
  if (IDENTITY.founder) organization.founder = { "@type": "Person", name: IDENTITY.founder };
  if (IDENTITY.sameAs.length > 0) organization.sameAs = IDENTITY.sameAs;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: IDENTITY.name,
        alternateName: IDENTITY.alternateName,
        url: IDENTITY.url,
        inLanguage: "en",
        publisher: { "@id": org },
      },
      organization,
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}/#app`,
        name: IDENTITY.name,
        description: IDENTITY.description,
        url: IDENTITY.url,
        operatingSystem: IDENTITY.app.operatingSystem,
        availableOnDevice: IDENTITY.app.device,
        applicationCategory: IDENTITY.app.category,
        publisher: { "@id": org },
      },
    ],
  };
}

/** The structured data as the text of a <script type="application/ld+json">, with "<" escaped so no string can close the tag. */
export function structuredDataScript(): string {
  return JSON.stringify(structuredData()).replace(/</g, "\\u003c");
}
