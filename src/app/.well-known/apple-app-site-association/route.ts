/**
 * Which links on krovvi.com open in the Krovvi app on an iPhone (universal
 * links, from the build that carries associatedDomains): a shared chat
 * (/s/...) and a live object (/o/...). Served as JSON with no redirect, as
 * Apple requires; Apple reads it about once a week (test with
 * ?mode=developer on a development build).
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      applinks: {
        details: [{ appIDs: ["X5X4TFRCN9.com.delvnco.catch8"], components: [{ "/": "/s/*" }, { "/": "/o/*" }] }],
      },
    },
    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } }
  );
}
