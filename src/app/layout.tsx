import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
