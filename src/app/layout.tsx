import type { Metadata, Viewport } from "next";
import "./globals.css";

const description =
  "Talk. Krovvi writes it down. Notes, tasks, and a memory of your world, made from your words.";

export const metadata: Metadata = {
  metadataBase: new URL("https://krovvi.com"),
  title: "Krovvi",
  description,
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    url: "https://krovvi.com",
    siteName: "Krovvi",
    title: "Krovvi",
    description: "Never lose a thought. Talk, and Krovvi writes it down.",
    images: [{ url: "/shots/mockup.png", alt: "Krovvi on iPhone" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krovvi",
    description: "Never lose a thought. Talk, and Krovvi writes it down.",
    images: ["/shots/mockup.png"],
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
      <body>{children}</body>
    </html>
  );
}
