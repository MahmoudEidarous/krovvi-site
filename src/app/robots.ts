import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/identity";

/**
 * robots.txt. Every crawler may read the whole site.
 *
 * The pages people send each other (/s a shared chat, /o an object, /r what
 * was agreed) and the dev views (/dev, /s/dev, /o/dev) stay out of search by
 * their own noindex, in the page and in an X-Robots-Tag header
 * (next.config.ts). A search engine only sees a noindex on a page it may
 * fetch, so they are not blocked here: blocked, a linked page could still be
 * listed by its address alone (Google's "Block Search indexing with noindex").
 *
 * Crawlers that gather pages to train AI, or for an AI's own search, follow
 * robots.txt but not always noindex, so they are kept off the pages people
 * send each other: a shared chat is for the person it was sent to. They still
 * read the rest of the site, /llms.txt included. Link previews are not among
 * them (iMessage and WhatsApp fetch from the phone; X, LinkedIn, Slack,
 * Telegram and Discord use their own agents), so every preview still draws.
 */
const PEOPLES_LINKS = ["/s/", "/o/", "/r/"];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "PerplexityBot",
  "CCBot",
  "meta-externalagent",
  "Bytespider",
  "Amazonbot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PEOPLES_LINKS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
