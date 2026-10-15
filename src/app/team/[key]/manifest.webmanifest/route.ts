import { isBoardKey } from "@/lib/team";

/**
 * The board's own manifest, one per link: saved to a home screen, the board
 * opens full screen on that same link (the site's manifest opens the site in
 * the browser, and its start is the home page).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isBoardKey(key)) return new Response("Not found", { status: 404 });
  const start = `/team/${key}`;
  return Response.json(
    {
      name: "Krovvi Team",
      short_name: "Krovvi Team",
      description: "Who used Krovvi, live.",
      lang: "en",
      start_url: start,
      scope: start,
      display: "standalone",
      background_color: "#0A0A0A",
      theme_color: "#0A0A0A",
      icons: [
        { src: "/brand/krovvi-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/brand/krovvi-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/brand/krovvi-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
