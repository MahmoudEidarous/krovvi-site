import type { Metadata, Viewport } from "next";
import "./globals.css";

const description =
  "Krovvi remembers what people told you, keeps track of what you promised, and notices what changed. So when you need it, it's already caught up.";

export const metadata: Metadata = {
  metadataBase: new URL("https://krovvi.com"),
  title: "Krovvi: the AI that knows your life",
  description,
  openGraph: {
    type: "website",
    url: "https://krovvi.com",
    siteName: "Krovvi",
    title: "Krovvi",
    description: "The AI that knows your life.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Krovvi",
    description: "The AI that knows your life.",
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
