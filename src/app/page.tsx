import type { Viewport } from "next";

import { Home } from "@/components/home/home";

import "./look.css";

/** The page is always light: its bars and its scrollbars are the light page's (its night parts are night by design). */
export const viewport: Viewport = {
  themeColor: "#F8F7FF",
  colorScheme: "light",
};

export default function Page() {
  return <Home />;
}
