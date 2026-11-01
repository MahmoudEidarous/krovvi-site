/**
 * Which links on krovvi.com open in the Krovvi app on an iPhone (universal
 * links, from the build that carries associatedDomains): a shared chat
 * (/s/...), a live object (/o/...), and Krovvi Together's post (/e/...) and
 * invite (/k/...), so a friend who has Krovvi lands on the post or the invite
 * in the app with one tap (2 November 2026); without the app the page opens as
 * before. Served as JSON with no redirect, as Apple requires; Apple reads it
 * about once a week (test with ?mode=developer on a development build).
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      applinks: {
        details: [{ appIDs: ["X5X4TFRCN9.com.delvnco.catch8"], components: [{ "/": "/s/*" }, { "/": "/o/*" }, { "/": "/e/*" }, { "/": "/k/*" }] }],
      },
    },
    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" } }
  );
}
