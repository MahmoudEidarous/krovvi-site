/**
 * What krovvi.com's own server sends with its reads of a Together post or invite (the edge function's address.ts in
 * the app repo, 2 November 2026): its key, and the visitor's address as Vercel saw it, so the function's minute limit
 * counts each visitor and never the site's few server addresses, which would hit the limit just as a post spreads.
 * Server only: the page files call it from headers(), and TOGETHER_SITE_KEY has no NEXT_PUBLIC_ prefix, so Next
 * never puts it in a browser bundle. With no key set, nothing is added and the reads count as they did.
 *
 * Vercel writes x-real-ip and x-forwarded-for itself and drops what a caller sent under those names, so on Vercel
 * the address is the visitor's own.
 */
export const SITE_KEY_HEADER = "x-together-site";
export const SITE_FOR_HEADER = "x-together-for";

export function siteHeaders(h: { get(name: string): string | null }, key: string | undefined = process.env.TOGETHER_SITE_KEY): Record<string, string> {
  const own = (key ?? "").trim();
  if (!own) return {};
  const ip = (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  return { [SITE_KEY_HEADER]: own, ...(ip && ip.length <= 45 ? { [SITE_FOR_HEADER]: ip } : {}) };
}
