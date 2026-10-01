import type { Metadata, Viewport } from "next";
import "./globals.css";

const description =
  "Krovvi is an iPhone app for the conversations in your life. It keeps track of what people promised, what was decided and what changed.";

export const metadata: Metadata = {
  metadataBase: new URL("https://krovvi.com"),
  title: "Krovvi: know where things stand with everyone",
  description,
  openGraph: {
    type: "website",
    url: "https://krovvi.com",
    siteName: "Krovvi",
    title: "Krovvi",
    description: "Know where things stand with everyone.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Krovvi",
    description: "Know where things stand with everyone.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Paint under the notch and the home indicator; the page is edge to edge dark.
  viewportFit: "cover",
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Without scripts nothing would ever be scrolled into view: show every end state at once. */}
        <noscript>
          <style>{`.anim,.anim-loop,.seq{animation:none!important}.transient{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
