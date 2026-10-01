import { PhoneScreen } from "./phone-screen";

/**
 * The device, drawn: no photo of a phone, so it is sharp at every size and
 * its screen can move. Screens are laid out at the iPhone's own 393 by 852
 * points and scaled to whatever width the phone is given (PhoneScreen
 * measures the glass and sets the scale before the first paint).
 *
 * Proportions follow an iPhone 17 Pro seen from the front: a thin titanium
 * band that catches the light at its corners, a black border of about two
 * percent, the buttons where they really are (action, volume, side and the
 * flush camera control), the island with its lens, and the home bar.
 * Every length is in cqw, a hundredth of the phone's width.
 */
export function Phone({ children, className, label, shadow = true, glint }: {
  children: React.ReactNode;
  className?: string;
  /** What the screen shows, for screen readers. */
  label?: string;
  /** The soft studio shadow under the phone; off when phones stand close together. */
  shadow?: boolean;
  /** When (ms after load) one soft light passes across the glass; none if not given. */
  glint?: number;
}) {
  const button = "absolute w-[0.95cqw]";
  const metal = "linear-gradient(90deg, #1b1b1a 0%, #4a4946 45%, #2a2a28 100%)";
  return (
    <div
      className={`relative w-full select-none ${className ?? ""}`}
      style={{ containerType: "inline-size" }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {/* Left: action button, volume up, volume down. Right: side button, camera control. */}
      <span className={`${button} left-[-0.6cqw] top-[44cqw] h-[8cqw] rounded-l-[0.6cqw]`} style={{ background: metal }} />
      <span className={`${button} left-[-0.6cqw] top-[63cqw] h-[14cqw] rounded-l-[0.6cqw]`} style={{ background: metal }} />
      <span className={`${button} left-[-0.6cqw] top-[81cqw] h-[14cqw] rounded-l-[0.6cqw]`} style={{ background: metal }} />
      <span
        className={`${button} right-[-0.6cqw] top-[66cqw] h-[22cqw] rounded-r-[0.6cqw]`}
        style={{ background: "linear-gradient(270deg, #1b1b1a 0%, #4a4946 45%, #2a2a28 100%)" }}
      />
      <span
        className={`${button} right-[-0.35cqw] top-[139cqw] h-[15cqw] rounded-r-[0.5cqw]`}
        style={{ background: "linear-gradient(270deg, #0d0d0c 0%, #2c2c2a 60%, #1a1a19 100%)" }}
      />

      {/* The titanium band: lit at the top left and the bottom right corners, darker along the sides. */}
      <div
        className="relative rounded-[16.6cqw] p-[1.35cqw]"
        style={{
          background:
            "conic-gradient(from 215deg at 50% 50%, #5b5a56 0deg, #2b2b29 40deg, #1d1d1c 90deg, #2b2b29 140deg, #6a6864 180deg, #2f2f2d 220deg, #1d1d1c 270deg, #2b2b29 320deg, #5b5a56 360deg)",
          boxShadow: [
            "inset 0 0 0 0.22cqw rgba(255,255,255,0.10)",
            "inset 0 0 0 0.5cqw rgba(0,0,0,0.25)",
            "0 0 0 0.18cqw #0b0b0a",
            ...(shadow
              ? ["0 6cqw 16cqw -2cqw rgba(0,0,0,0.65)", "0 18cqw 40cqw -10cqw rgba(0,0,0,0.55)", "0 1.2cqw 2.5cqw rgba(0,0,0,0.45)"]
              : []),
          ].join(", "),
        }}
      >
        <div className="rounded-[15.25cqw] bg-black p-[2.05cqw]" style={{ boxShadow: "inset 0 0 0 0.25cqw #050505" }}>
          <PhoneScreen
            className="relative overflow-hidden rounded-[13.2cqw] bg-[var(--bg)]"
            style={{ containerType: "inline-size", aspectRatio: "393 / 852" }}
          >
            <div className="phone-canvas absolute left-0 top-0 h-[852px] w-[393px] text-left">
              {children}
              {/* The island, with the lens a shade lighter on its right. */}
              <div className="pointer-events-none absolute left-1/2 top-[11px] z-50 flex h-[37px] w-[126px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[13px]">
                <span className="h-[11px] w-[11px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #2a2d36 0%, #121318 55%, #050505 100%)" }} />
              </div>
              {/* The home bar. */}
              <div className="pointer-events-none absolute bottom-[8px] left-1/2 z-50 h-[5px] w-[139px] -translate-x-1/2 rounded-full bg-[#EDEDEB]/90" />
            </div>
            {glint !== undefined && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[13.2cqw]">
                <div
                  className="anim transient absolute inset-y-0 left-0 w-[60%] opacity-0"
                  style={{ "--a": "k-glint", "--dur": "1700ms", "--delay": `${glint}ms` } as React.CSSProperties}
                >
                  {/* Soft on both sides everywhere: the band is upright and leaned by a skew, not by the gradient. */}
                  <div
                    className="h-full w-full"
                    style={{
                      transform: "skewX(-16deg)",
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.065) 38%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.065) 62%, transparent 100%)",
                    }}
                  />
                </div>
              </div>
            )}
            {/* The glass: a faint sheen from the top left, and its edge. */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[13.2cqw]"
              style={{
                background:
                  "linear-gradient(122deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 30%, rgba(255,255,255,0) 52%)",
                boxShadow: "inset 0 0 0 0.25cqw rgba(255,255,255,0.03)",
              }}
            />
          </PhoneScreen>
        </div>
      </div>
    </div>
  );
}
