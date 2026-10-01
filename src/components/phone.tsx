/**
 * The device, drawn: no photo of a phone, so it is sharp at every size and
 * its screen can move. Screens are laid out at the iPhone's own 393 by 852
 * points and scaled to whatever width the phone is given. The scale is the
 * screen's width over 393, worked out in CSS (tan(atan2(a, b)) is a / b as a
 * plain number), so there is no measuring script and no jump on load.
 */
export function Phone({ children, className, label }: {
  children: React.ReactNode;
  className?: string;
  /** What the screen shows, for screen readers. */
  label?: string;
}) {
  return (
    <div
      className={`relative w-full select-none ${className ?? ""}`}
      style={{ containerType: "inline-size" }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {/* Side buttons: action and volume on the left, power on the right. */}
      <span className="absolute left-[-0.55cqw] top-[21cqw] h-[6.5cqw] w-[1cqw] rounded-l-[0.6cqw] bg-[#2b2b29]" />
      <span className="absolute left-[-0.55cqw] top-[33cqw] h-[12cqw] w-[1cqw] rounded-l-[0.6cqw] bg-[#2b2b29]" />
      <span className="absolute left-[-0.55cqw] top-[48cqw] h-[12cqw] w-[1cqw] rounded-l-[0.6cqw] bg-[#2b2b29]" />
      <span className="absolute right-[-0.55cqw] top-[38cqw] h-[19cqw] w-[1cqw] rounded-r-[0.6cqw] bg-[#2b2b29]" />
      <div
        className="relative rounded-[16.4cqw] p-[2.3cqw]"
        style={{
          background:
            "linear-gradient(150deg, #4a4a47 0%, #252524 18%, #161615 50%, #262625 82%, #3b3b38 100%)",
          boxShadow:
            "0 0 0 0.35cqw #0e0e0d, inset 0 0 0 0.3cqw rgba(255,255,255,0.10), 0 4cqw 12cqw rgba(0,0,0,0.55), 0 1cqw 3cqw rgba(0,0,0,0.5)",
        }}
      >
        <div className="rounded-[14.2cqw] bg-black p-[1.25cqw]">
          <div
            className="relative overflow-hidden rounded-[12.9cqw] bg-[var(--bg)]"
            style={{ containerType: "inline-size", aspectRatio: "393 / 852" }}
          >
            <div
              className="absolute left-0 top-0 h-[852px] w-[393px] origin-top-left text-left"
              style={{ transform: "scale(tan(atan2(100cqw, 393px)))" }}
            >
              {children}
              <div className="pointer-events-none absolute left-1/2 top-[11px] z-50 h-[36px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
            </div>
            {/* A faint sheen across the glass. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(125deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.0) 34%, rgba(255,255,255,0) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
