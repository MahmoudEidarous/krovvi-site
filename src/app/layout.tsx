import type { Metadata, Viewport } from "next";
import "./globals.css";

import { IDENTITY, SITE_URL, structuredDataScript } from "@/lib/identity";

/**
 * What Google, a chat app's link preview and a home screen show of the site, all
 * from lib/identity.ts. The pictures come from the file conventions beside this
 * file: favicon.ico (16, 32 and 48), icon.svg, apple-icon.png (180),
 * opengraph-image.png and twitter-image.png (1200 x 630), and manifest.ts.
 *
 * "./" is the page's own address: Next resolves it against each page's path, so
 * every page's canonical and og:url name that page, and no page can inherit
 * the home's (a canonical to the home on a noindex page could carry the
 * noindex over to the home).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: IDENTITY.title, template: IDENTITY.titleTemplate },
  description: IDENTITY.description,
  applicationName: IDENTITY.name,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    url: "./",
    siteName: IDENTITY.name,
    title: IDENTITY.ogTitle,
    description: IDENTITY.ogDescription,
    locale: IDENTITY.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: IDENTITY.ogTitle,
    description: IDENTITY.ogDescription,
  },
  // A home screen icon keeps the name short and opens the site in Safari: the app is the iPhone app, not this page.
  appleWebApp: { title: IDENTITY.name, capable: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Paint under the notch and the home indicator; the page is edge to edge dark.
  viewportFit: "cover",
  themeColor: IDENTITY.colors.sky,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Without scripts nothing would ever be scrolled into view: show every end state at once, and size
            the phone screens in CSS alone (right everywhere but Safari 26, which only matters with scripts off). */}
        <noscript>
          <style>{`.anim,.anim-loop,.seq{animation:none!important}.transient{display:none!important}.phone-canvas{transform:scale(tan(atan2(100cqw,393px)))!important}.scaled-canvas{transform:scale(tan(atan2(100cqw,var(--sw))))!important}`}</style>
        </noscript>
        {/* The site, the company and the app for search engines and AI assistants (lib/identity.ts). */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
