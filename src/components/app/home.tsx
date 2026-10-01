import type { CSSProperties } from "react";

import { MicGlyph } from "./chat";
import { KGlyph, StatusBar } from "./ui";

/**
 * Krovvi's Home, drawn to the app's numbers (catch8 app/index.tsx; the site's
 * docs/app-visual-spec.md, sections 5.1 to 5.5): search, sort and add on top,
 * the lenses, today's notes, and the dock with the record button riding on
 * its top edge.
 */

/** Memory: a brain with a centre dot. */
function MemoryGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" stroke="#8F8F8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 3.6c-1.5-1.4-4.4-.7-4.6 1.6-1.6.4-2.4 2.2-1.5 3.6-1 1.3-.4 3.3 1.2 3.7.3 2.2 3 3 4.9 1.7" />
      <path d="M9.5 3.6c1.5-1.4 4.4-.7 4.6 1.6 1.6.4 2.4 2.2 1.5 3.6 1 1.3.4 3.3-1.2 3.7-.3 2.2-3 3-4.9 1.7" />
      <path d="M9.5 3.6v10.6" />
      <circle cx="9.5" cy="9" r="1" fill="#8F8F8A" stroke="none" />
    </svg>
  );
}

/** Tasks: six dots on a ring, the ten o'clock one faint while anything is owed. */
function TasksGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        return <circle key={i} cx={9.5 + 6.6 * Math.cos(a)} cy={9.5 + 6.6 * Math.sin(a)} r="1.7" fill="#8F8F8A" opacity={i === 5 ? 0.3 : 1} />;
      })}
    </svg>
  );
}

/** Settings: two rails with filled knobs. */
function SlidersGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" stroke="#8F8F8A" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M2 6h15M2 13h15" />
      <circle cx="6.5" cy="6" r="2.2" fill="#8F8F8A" />
      <circle cx="12.5" cy="13" r="2.2" fill="#8F8F8A" />
    </svg>
  );
}

function Door({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex min-w-[56px] flex-col items-center gap-[4px] py-[8px]">
      <span className="flex h-[19px] w-[19px] items-center justify-center">{children}</span>
      <span className="text-[11px] font-medium tracking-[0.1px] text-muted">{label}</span>
    </span>
  );
}

/** The record button: a white disc with the dot mic, its centre on the dock's top edge. */
export function RecordButton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`flex h-[58px] w-[58px] items-center justify-center rounded-full bg-ink ${className ?? ""}`}
      style={{ boxShadow: "0 10px 16px rgba(0,0,0,0.5), 0 3px 5px rgba(0,0,0,0.4)", ...style }}
    >
      <MicGlyph size={27} weight={1.9} />
    </span>
  );
}

/** The dock: Memory and Tasks, a gap held for the record button, Krovvi and Settings. */
export function Dock({ press }: { press?: number }) {
  return (
    <div className="absolute inset-x-[12px] bottom-[24px] h-[104px]">
      <div className="absolute inset-x-0 bottom-0 flex h-[66px] items-center rounded-[30px] border-[0.5px] border-line bg-card-hi">
        <div className="flex flex-1 justify-evenly">
          <Door label="Memory">
            <MemoryGlyph />
          </Door>
          <Door label="Tasks">
            <TasksGlyph />
          </Door>
        </div>
        <div className="w-[88px] shrink-0" />
        <div className="flex flex-1 justify-evenly">
          <Door label="Krovvi">
            <KGlyph size={19} color="#8F8F8A" />
          </Door>
          <Door label="Settings">
            <SlidersGlyph />
          </Door>
        </div>
      </div>
      <div className="absolute left-1/2 top-[9px] -translate-x-1/2">
        <RecordButton className={press !== undefined ? "seq" : undefined} style={press !== undefined ? { animation: `k-press 360ms var(--ease) ${press}ms both` } : undefined} />
      </div>
    </div>
  );
}

const NOTES: Array<{ title: string; preview: string; meta: string }> = [
  {
    title: "Atlas sync",
    preview: "The launch moves to October 15. Sara owns the final copy, and you send the new deck by Friday.",
    meta: "6:17 pm  ·  31:04",
  },
  {
    title: "Kitchen walkthrough with Karim",
    preview: "42,000 in total, half up front and half when the kitchen is done. Work starts on the 5th.",
    meta: "10:40 am  ·  31:40",
  },
];

/** Home, as it looks between recordings. */
export function HomeScreen({ press }: { press?: number }) {
  return (
    <div className="relative h-full w-full bg-ground">
      <StatusBar />
      <div className="absolute inset-x-[16px] top-[71px] flex gap-[8px]">
        <span className="flex h-[46px] flex-1 items-center gap-[10px] rounded-[16px] border-[0.5px] border-line bg-card-hi px-[14px] text-[14px] text-faint">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#7A7A74" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="m10.3 10.3 3.2 3.2" />
          </svg>
          Search everything you&apos;ve said
        </span>
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[0.5px] border-line bg-card-hi">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#8F8F8A" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M2 4h11M2 7.5h7.3M2 11h3.7" />
          </svg>
        </span>
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[0.5px] border-line bg-card-hi">
          <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
            <path d="M7.5 1v13M1 7.5h13" stroke="#EDEDEB" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <div className="absolute left-[16px] top-[129px] flex gap-[18px] text-[15px] font-medium tracking-[-0.2px] text-muted">
        <span className="relative text-ink">
          All
          <span className="absolute -bottom-[10px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-ink" />
        </span>
        <span>Folders</span>
        <span>
          Recordings <span className="text-[12px] text-faint">24</span>
        </span>
        <span>
          Files <span className="text-[12px] text-faint">6</span>
        </span>
      </div>
      <div className="absolute inset-x-[16px] top-[193px]">
        <div className="px-[4px] pb-[2px] pt-[8px] text-[11px] uppercase tracking-[1px] text-faint">Today</div>
        <div className="mt-[6px] flex flex-col gap-[8px]">
          {NOTES.map((n) => (
            <div key={n.title} className="rounded-[17px] bg-card px-[14px] py-[10px]">
              <div className="text-[16px] font-medium leading-[24px] tracking-[-0.3px] text-ink">{n.title}</div>
              <div className="mt-[2px] line-clamp-2 text-[14px] leading-[22px] tracking-[-0.15px] text-soft">{n.preview}</div>
              <div className="mt-[4px] text-[12px] text-faint tabular">{n.meta}</div>
            </div>
          ))}
        </div>
      </div>
      <Dock press={press} />
    </div>
  );
}
