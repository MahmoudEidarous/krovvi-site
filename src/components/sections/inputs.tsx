import { InView } from "@/components/in-view";
import { KAlive } from "@/components/mark";
import { an } from "@/lib/anim";

type Glyph = "mic" | "video" | "photo" | "doc" | "link" | "chat" | "mail" | "calendar" | "person" | "folder" | "note" | "spark";

const INNER: Array<[string, Glyph]> = [
  ["Voice", "mic"],
  ["Meetings", "video"],
  ["Photos", "photo"],
  ["PDFs", "doc"],
  ["Links", "link"],
  ["WhatsApp chats", "chat"],
];
const OUTER: Array<[string, Glyph]> = [
  ["Gmail", "mail"],
  ["Calendar", "calendar"],
  ["Contacts", "person"],
  ["Google Drive", "folder"],
  ["Notes you type", "note"],
  ["ChatGPT memory", "spark"],
  ["Claude memory", "spark"],
];

function Icon({ name }: { name: Glyph }) {
  const p = { fill: "none", stroke: "#EDEDEB", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {name === "mic" && (
        <>
          <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" {...p} />
          <path d="M3 8a5 5 0 0 0 10 0M8 13v1.5" {...p} />
        </>
      )}
      {name === "video" && (
        <>
          <rect x="1.5" y="4" width="9" height="8" rx="2" {...p} />
          <path d="m10.5 7 4-2.2v6.4l-4-2.2" {...p} />
        </>
      )}
      {name === "photo" && (
        <>
          <rect x="1.5" y="2.5" width="13" height="11" rx="2.2" {...p} />
          <circle cx="5.5" cy="6.3" r="1.2" fill="#EDEDEB" />
          <path d="m2 12 4-3.5 3 2.5 2-1.6 3.5 2.6" {...p} />
        </>
      )}
      {name === "doc" && (
        <>
          <path d="M4 1.5h5.2l3.3 3.3v9.7H4z" {...p} />
          <path d="M9 1.7v3.3h3.3M6 8.5h4.5M6 11h4.5" {...p} />
        </>
      )}
      {name === "link" && <path d="M6.6 9.4 9.4 6.6M7 4.3l1.3-1.3a3 3 0 0 1 4.3 4.3L11.3 8.6M8.7 11.7 7.4 13a3 3 0 0 1-4.3-4.3l1.3-1.3" {...p} />}
      {name === "chat" && <path d="M2 7.6C2 4.8 4.7 2.6 8 2.6s6 2.2 6 5-2.7 5-6 5c-.8 0-1.6-.1-2.3-.4L2.5 13.4l.9-2.8C2.5 9.8 2 8.8 2 7.6Z" {...p} />}
      {name === "mail" && (
        <>
          <rect x="1.5" y="3" width="13" height="10" rx="2" {...p} />
          <path d="m2 4.2 6 4.6 6-4.6" {...p} />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="1.5" y="2.8" width="13" height="11.5" rx="2" {...p} />
          <path d="M1.5 6.3h13M5 1.5v2.6M11 1.5v2.6" {...p} />
        </>
      )}
      {name === "person" && (
        <>
          <circle cx="8" cy="5.3" r="2.8" {...p} />
          <path d="M2.8 14c.6-2.7 2.7-4.3 5.2-4.3s4.6 1.6 5.2 4.3" {...p} />
        </>
      )}
      {name === "folder" && <path d="M1.5 4.3c0-.9.7-1.6 1.6-1.6h3.1l1.5 1.7h5.2c.9 0 1.6.7 1.6 1.6v6.4c0 .9-.7 1.6-1.6 1.6H3.1c-.9 0-1.6-.7-1.6-1.6z" {...p} />}
      {name === "note" && (
        <>
          <path d="M10.8 2.2 13.8 5.2 6 13H3v-3z" {...p} />
        </>
      )}
      {name === "spark" && (
        <>
          <circle cx="8" cy="8" r="1.6" fill="#EDEDEB" />
          <circle cx="8" cy="2.6" r="1" fill="#EDEDEB" />
          <circle cx="8" cy="13.4" r="1" fill="#EDEDEB" />
          <circle cx="2.6" cy="8" r="1" fill="#EDEDEB" />
          <circle cx="13.4" cy="8" r="1" fill="#EDEDEB" />
        </>
      )}
    </svg>
  );
}

function Chip({ label, icon }: { label: string; icon: Glyph }) {
  return (
    <span
      title={label}
      className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-card px-[10px] py-[10px] text-[14px] text-soft shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:px-[13px] sm:py-[8px]"
    >
      <Icon name={icon} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </span>
  );
}

function Ring({ items, radius, seconds, reverse = false, offset = 0 }: {
  items: Array<[string, Glyph]>;
  radius: number;
  seconds: number;
  reverse?: boolean;
  offset?: number;
}) {
  return (
    <div
      className="orbit absolute inset-0"
      style={{ animation: `${reverse ? "k-orbit-back" : "k-orbit"} ${seconds}s linear infinite` }}
    >
      {items.map(([label, icon], i) => {
        const a = offset + (i * 360) / items.length;
        return (
          <div
            key={label}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `rotate(${a}deg) translateX(${radius}cqw) rotate(${-a}deg)` }}
          >
            <div
              className="orbit-back origin-top-left"
              style={{ animation: `${reverse ? "k-orbit" : "k-orbit-back"} ${seconds}s linear infinite` }}
            >
              <Chip label={label} icon={icon} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Dots arriving at the K from every side: what you send, landing in one place. */
const INFLOW = Array.from({ length: 16 }, (_, i) => {
  const angle = (i * 137.508 * Math.PI) / 180;
  const reach = 30 + (i % 3) * 6;
  return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, delay: (i * 0.41) % 4.2 };
});

export function Inputs() {
  return (
    <section className="relative px-5 pt-[140px] md:pt-[200px]">
      <InView className="mx-auto max-w-[1120px] text-center">
        <h2 style={an("k-rise-lg", 0, 1000)} className="anim mx-auto max-w-[780px] text-balance text-[clamp(36px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.04em]">
          Tell it things. Send it things.
        </h2>
        <p style={an("k-rise", 150, 900)} className="anim mx-auto mt-5 max-w-[640px] text-pretty text-[clamp(17px,2.2vw,20px)] leading-[1.6] text-muted">
          Share a PDF, a link, a photo or a WhatsApp chat. Connect Gmail and your calendar. Bring what ChatGPT and Claude
          already know about you. It all lands in one place, linked to the people it is about.
        </p>
      </InView>
      <InView className="relative mx-auto mt-10 aspect-square w-[min(640px,100%)] md:mt-4" style={{ containerType: "inline-size" }}>
        <div className="glow left-1/2 top-1/2 h-[90cqw] w-[90cqw] -translate-x-1/2 -translate-y-1/2" />
        {/* The two rings the things travel on. */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="27" fill="none" stroke="#262625" strokeWidth="0.25" strokeDasharray="0.4 1.6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#262625" strokeWidth="0.25" strokeDasharray="0.4 1.6" />
        </svg>
        <div className="absolute left-1/2 top-1/2">
          {INFLOW.map((d, i) => (
            <span
              key={i}
              className="inflow absolute h-[1.1cqw] w-[1.1cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
              style={
                {
                  "--x": `${d.x}cqw`,
                  "--y": `${d.y}cqw`,
                  animation: `k-inflow 4.2s cubic-bezier(0.55,0,0.35,1) ${d.delay}s infinite`,
                  opacity: 0,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <Ring items={INNER} radius={27} seconds={90} />
        <Ring items={OUTER} radius={42} seconds={130} reverse offset={18} />
        <div className="absolute left-1/2 top-1/2 flex h-[22cqw] w-[22cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ground shadow-[0_0_80px_rgba(237,237,235,0.08)]">
          <KAlive size={120} className="h-[15cqw] w-[15cqw]" />
        </div>
      </InView>
    </section>
  );
}
