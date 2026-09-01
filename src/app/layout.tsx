import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Krovvi",
  description:
    "Talk. Krovvi writes it down. Notes, tasks, and a memory of your world, made from your words.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Krovvi",
    description: "Never lose a thought. Talk, and Krovvi writes it down.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
