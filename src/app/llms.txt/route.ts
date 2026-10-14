import { llmsText } from "@/lib/identity";

/**
 * /llms.txt (llmstxt.org): what Krovvi is, in plain words, for AI assistants
 * and the tools that read a site for them. Built once, from lib/identity.ts, so
 * it never says something the rest of the site does not.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsText(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
