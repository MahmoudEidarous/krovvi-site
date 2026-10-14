import type { MetadataRoute } from "next";

import { IDENTITY } from "@/lib/identity";

/**
 * manifest.webmanifest: the name and the K for a home screen or a browser that
 * saves the site. "browser": the site opens in the browser, so no browser
 * offers to install it as if it were the app (the app is the iPhone app).
 * The K sits inside the middle 80 percent of the 512 icon, so the same file
 * serves as a maskable icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: IDENTITY.name,
    short_name: IDENTITY.name,
    description: IDENTITY.description,
    lang: "en",
    start_url: "/",
    display: "browser",
    background_color: IDENTITY.colors.sky,
    theme_color: IDENTITY.colors.sky,
    icons: [
      { src: "/brand/krovvi-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/krovvi-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/krovvi-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
