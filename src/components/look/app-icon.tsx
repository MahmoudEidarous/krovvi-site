/**
 * Krovvi's mark as the app itself shows it: its icon, the white k on purple (the owner, 13 November 2026: "we do not
 * have dots anymore"). Never drawn again here: public/brand/app-icon-72.png is the app's own icon (catch8
 * assets/images/icon.png, the file app.json names) made smaller, nothing else, and rounded the way a home screen
 * rounds it (the site's own tile, look.css .ktile, 22.5 percent). 72 pixels is sharp up to 24 points on a 3x screen
 * and weighs 4 KB, and it is asked for after the page's own code (fetchPriority low), so a short chat opens no later
 * than it did with the dots.
 */
export function AppIcon({ size, className }: { size: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/app-icon-72.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
      fetchPriority="low"
      className={className}
      style={{ width: size, height: size, borderRadius: "22.5%", display: "block", flex: "none" }}
    />
  );
}
