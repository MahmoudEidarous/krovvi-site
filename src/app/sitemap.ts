import type { MetadataRoute } from "next";

import { PAGES, absolute } from "@/lib/identity";

/**
 * sitemap.xml: the pages people can find (lib/identity.ts PAGES). No dates:
 * Google uses lastmod only when it is exact, and priority and changefreq not
 * at all ("Build and submit a sitemap").
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((page) => ({ url: absolute(page.path) }));
}
