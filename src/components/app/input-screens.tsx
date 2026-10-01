import type { CSSProperties, ReactNode } from "react";

import { an } from "@/lib/anim";
import {
  ActionIcons,
  AnswerText,
  ArrowUpGlyph,
  ChatNav,
  ComposerField,
  CrossGlyph,
  DiscFace,
  MemoryChip,
  MicGlyph,
  StopSquare,
  UserBubble,
  WorkingStrip,
} from "./chat";
import { HomeScreen } from "./home";
import { AppIcon, StatusBar } from "./ui";

/**
 * The ways in, as the app shows them: telling Krovvi something in the chat,
 * adding a file from the Add sheet, and sharing from another app through
 * Krovvi's share extension. Each is a short film of about five seconds,
 * drawn to the app's numbers (see chat.tsx).
 */

const seq = (animation: string): CSSProperties => ({ animation });
const EASE = "var(--ease)";

/* ── Chat: tell it something worth keeping ──────────────────────────────── */

export function ChatTellScreen() {
  const said = "Lina has the kids on Wednesday, so I'm free after 4.";
  const start = 350;
  const typeEnd = start + said.length * 30;
  const sendAt = typeEnd + 360;
  const workAt = sendAt + 260;
  const answerAt = sendAt + 1300;
  const reply = "Got it. You're free on Wednesday from 4.".split(" ");
  const answerEnd = answerAt + reply.length * 42;
  return (
    <div className="relative h-full w-full bg-ground">
      <ChatNav />
      <div className="absolute inset-x-[20px] top-[123px]">
        <UserBubble className="anim" style={an("k-pop", sendAt + 60, 320)}>
          {said}
        </UserBubble>
        <div className="relative mt-[20px]">
          <WorkingStrip
            status="Keeping what you said…"
            tick={sendAt + 1000}
            className="seq transient absolute inset-x-0 top-0"
            style={seq(`k-rise 320ms ${EASE} ${workAt}ms both, k-gone-fast 120ms linear ${answerAt - 170}ms forwards`)}
          />
          <AnswerText>
            {reply.map((w, i) => (
              <span key={i} className="anim" style={an("k-fade", answerAt + i * 42, 220)}>
                {w}{" "}
              </span>
            ))}
          </AnswerText>
          <MemoryChip lines={["Saved: Lina has the kids on Wednesday"]} className="anim mt-[16px]" style={an("k-pop", answerEnd + 250, 450)} />
          <div className="anim -ml-[8px] mt-[8px]" style={an("k-fade", answerEnd + 600, 400)}>
            <ActionIcons />
          </div>
        </div>
      </div>
      <ComposerField
        discStyle={seq(`k-press 260ms ${EASE} ${typeEnd + 170}ms both`)}
        disc={
          <>
            <DiscFace className="seq" style={seq(`k-off ${answerEnd - start}ms linear ${start}ms`)}>
              <MicGlyph />
            </DiscFace>
            <DiscFace className="seq opacity-0" style={seq(`k-on ${sendAt - start}ms linear ${start}ms`)}>
              <ArrowUpGlyph />
            </DiscFace>
            <DiscFace className="seq opacity-0" style={seq(`k-on ${answerEnd - sendAt}ms linear ${sendAt}ms`)}>
              <StopSquare />
            </DiscFace>
          </>
        }
      >
        <span className="seq absolute left-[8px] top-[10px] whitespace-nowrap text-faint" style={seq(`k-off ${sendAt - start}ms linear ${start}ms`)}>
          Ask, or give it a job
        </span>
        <span className="seq transient" style={seq(`k-collapse 1ms linear ${sendAt}ms forwards`)}>
          {said.split("").map((c, i) => (
            <span key={i} className="anim" style={an("k-char", start + i * 30, 1)}>
              {c}
            </span>
          ))}
        </span>
      </ComposerField>
    </div>
  );
}

/* ── Upload: the Add sheet, then a lease read and summed up ─────────────── */

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#EDEDEB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ADD_ROWS: Array<{ label: string; line: string; glyph: ReactNode }> = [
  {
    label: "Write a note",
    line: "A blank page for your own words",
    glyph: (
      <Glyph>
        <path d="M15.5 3.5 19 7 9 17l-4.5 1 1-4.5Z" />
        <circle cx="13" cy="20.5" r="0.6" fill="#EDEDEB" />
        <circle cx="16.5" cy="20.5" r="0.6" fill="#EDEDEB" />
        <circle cx="20" cy="20.5" r="0.6" fill="#EDEDEB" />
      </Glyph>
    ),
  },
  {
    label: "Take a photo",
    line: "Read as soon as it is taken",
    glyph: (
      <Glyph>
        <path d="M4.5 7.5h3l1.5-2.5h6l1.5 2.5h3A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" />
        <circle cx="12" cy="13.2" r="2.6" fill="#EDEDEB" />
      </Glyph>
    ),
  },
  {
    label: "Photos and videos",
    line: "Up to twenty at once, a video up to ten minutes",
    glyph: (
      <Glyph>
        <rect x="3" y="4.5" width="18" height="15" rx="3" />
        <circle cx="16.5" cy="9" r="1.3" fill="#EDEDEB" />
        <path d="m3.5 17 5.5-6 4.5 5 2-2 4.5 4" />
      </Glyph>
    ),
  },
  {
    label: "Choose files",
    line: "PDF, Word, slides, sheets, email",
    glyph: (
      <Glyph>
        <path d="M3.5 13.5v4A2.5 2.5 0 0 0 6 20h12a2.5 2.5 0 0 0 2.5-2.5v-4" />
        <path d="M12 7v8.5M8.5 12.5 12 16l3.5-3.5" />
        <circle cx="12" cy="3.6" r="0.7" fill="#EDEDEB" />
      </Glyph>
    ),
  },
  {
    label: "Paste a link",
    line: "A page is read, a video is watched",
    glyph: (
      <Glyph>
        <path d="M10.2 13.8a3.5 3.5 0 0 0 5 0l3.3-3.3a3.5 3.5 0 0 0-5-5l-1.1 1.1" />
        <path d="M13.8 10.2a3.5 3.5 0 0 0-5 0l-3.3 3.3a3.5 3.5 0 0 0 5 5l1.1-1.1" />
      </Glyph>
    ),
  },
  {
    label: "Paste text",
    line: "What is on the clipboard becomes a note",
    glyph: (
      <Glyph>
        <circle cx="4.5" cy="6.5" r="0.7" fill="#EDEDEB" />
        <path d="M8.5 6.5h11" />
        <circle cx="4.5" cy="12" r="0.7" fill="#EDEDEB" />
        <path d="M8.5 12h11" />
        <circle cx="4.5" cy="17.5" r="0.7" fill="#EDEDEB" />
        <path d="M8.5 17.5h6" />
      </Glyph>
    ),
  },
];

/** The page of a file Krovvi has read: back, open, delete. */
function ItemNav() {
  return (
    <div className="absolute inset-x-[16px] top-[63px] flex justify-between">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card">
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" stroke="#EDEDEB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6.5 1.5 1.5 6.5l5 5" />
        </svg>
      </span>
      <span className="flex gap-[8px]">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#EDEDEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 1.5h6.5V8M10.5 1.5 1.5 10.5" />
          </svg>
        </span>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8F8F8A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3.2 3.5l.6 8.5h6.4l.6-8.5" />
          </svg>
        </span>
      </span>
    </div>
  );
}

/** Krovvi reading: the K loader beside the words. */
function Reading({ words, className, style }: { words: string; className?: string; style?: CSSProperties }) {
  const dots: Array<[number, number]> = [[40, 28], [40, 60], [40, 92], [61, 45], [82, 30], [61, 75], [82, 90]];
  return (
    <div className={`flex items-center gap-[12px] p-[8px] ${className ?? ""}`} style={style}>
      <svg width="22" height="22" viewBox="0 0 120 120" aria-hidden="true">
        {dots.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={8}
            fill="#A9A8A2"
            style={{ opacity: 0.22, animation: `k-think 1400ms cubic-bezier(0.23,1,0.32,1) ${i * 140}ms infinite` }}
          />
        ))}
      </svg>
      <span className="text-[14px] leading-[20px] text-muted">{words}</span>
    </div>
  );
}

/** The first page of the lease, as the file card shows it: paper, cropped from the top. */
function LeasePage() {
  const lines = [92, 100, 96, 100, 64, 0, 100, 98, 100, 86, 0, 100, 94, 72];
  return (
    <div className="relative h-[200px] overflow-hidden bg-[#E9E7E1] px-[46px] pt-[26px]">
      <div className="text-center text-[11px] font-bold uppercase tracking-[1.6px] text-[#2a2a28]">Residential lease</div>
      <div className="mt-[3px] text-center text-[7px] text-[#6b6a66]">Apartment 4B · 1 March 2026 to 28 February 2027</div>
      <div className="mt-[14px] flex flex-col gap-[5px]">
        {lines.map((w, i) =>
          w === 0 ? (
            <span key={i} className="h-[3px]" />
          ) : (
            <span key={i} className="h-[3px] rounded-full bg-[#b9b7b0]" style={{ width: `${w}%` }} />
          )
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[72px]" style={{ background: "linear-gradient(to bottom, rgba(22,22,21,0), rgba(22,22,21,0.55))" }} />
    </div>
  );
}

export function UploadScreen() {
  const pickAt = 1350;
  const openAt = 1850;
  const titleAt = 3300;
  const summary = [
    { bullet: false, text: "The rent goes up to 1,450 a month from March." },
    { bullet: true, text: "You now need to give 60 days' notice to leave, up from 30." },
    { bullet: true, text: "Repairs you report must be fixed within 7 days." },
  ];
  let t = titleAt + 350;
  return (
    <div className="relative h-full w-full overflow-hidden bg-ground">
      {/* Home behind the sheet, with its dock and the record button. */}
      <HomeScreen />
      <div className="seq transient absolute inset-0 bg-black/60" style={seq(`k-fade 240ms ${EASE} 0ms both, k-hide 140ms linear ${openAt - 200}ms forwards`)} />

      {/* The Add sheet: capture above the line, paste below. */}
      <div
        className="seq transient absolute inset-x-0 bottom-0 rounded-t-[22px] bg-card px-[12px] pb-[50px] pt-[8px]"
        style={seq(`k-sheet-up 300ms ${EASE} 120ms both, k-sheet-down 220ms ${EASE} ${openAt - 280}ms forwards`)}
      >
        <div className="flex justify-center py-[8px]">
          <span className="h-[4px] w-[36px] rounded-full bg-line" />
        </div>
        <div className="px-[14px] pb-[10px] pt-[6px] text-[22px] font-semibold leading-[28px] tracking-[-0.8px] text-ink">Add</div>
        {ADD_ROWS.map((row, i) => (
          <div key={row.label}>
            {i === 4 && <div className="mx-[12px] my-[8px] h-[0.5px] bg-line" />}
            <div
              className={`flex items-center gap-[14px] rounded-[11px] px-[14px] py-[11px] ${i === 3 ? "seq" : ""}`}
              style={i === 3 ? seq(`k-row-press 380ms ${EASE} ${pickAt}ms both`) : undefined}
            >
              <span className="flex h-[24px] w-[24px] items-center justify-center">{row.glyph}</span>
              <span className="flex flex-col gap-[2px]">
                <span className="text-[16px] font-medium leading-[20px] tracking-[-0.3px] text-ink">{row.label}</span>
                <span className="text-[12.5px] leading-[16px] text-faint">{row.line}</span>
              </span>
            </div>
          </div>
        ))}
        <div className="px-[14px] pb-[4px] pt-[12px] text-[12px] text-faint">From any other app, share to Krovvi.</div>
      </div>

      {/* The lease, once chosen: the file, then what Krovvi read in it. */}
      <div className="anim absolute inset-0 bg-ground" style={an("k-fade", openAt, 300)}>
        <StatusBar />
        <ItemNav />
        <div className="absolute inset-x-[16px] top-[113px] flex flex-col gap-[16px]">
          <div className="overflow-hidden rounded-[17px] bg-card">
            <LeasePage />
            <div className="flex items-center gap-[12px] p-[14px]">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-[20px] tracking-[-0.3px] text-ink">Lease 2026.pdf</span>
                <span className="block text-[12.5px] text-faint">PDF · 12 pages</span>
              </span>
              <span className="text-[13px] text-soft">Open</span>
            </div>
          </div>
          <div className="relative min-h-[200px]">
            <Reading
              words="Reading the document…"
              className="seq transient absolute -left-[8px] top-0"
              style={seq(`k-fade 240ms ${EASE} ${openAt + 250}ms both, k-gone-fast 140ms linear ${titleAt - 100}ms forwards`)}
            />
            <div className="anim px-[4px] pt-[4px] text-[24px] font-semibold leading-[30px] tracking-[-0.8px] text-ink" style={an("k-rise", titleAt, 450)}>
              Your new lease
            </div>
            <div className="mt-[10px] flex flex-col gap-[10px] px-[4px]">
              {summary.map((line) => {
                const begin = t;
                t += line.text.split(" ").length * 38 + 160;
                return (
                  <div key={line.text} className="flex gap-[10px] text-[16px] leading-[23.2px] tracking-[-0.2px] text-ink">
                    {line.bullet && (
                      <span className="anim text-faint" style={an("k-fade", begin, 200)}>
                        •
                      </span>
                    )}
                    <span>
                      {line.text.split(" ").map((w, i) => (
                        <span key={i} className="anim" style={an("k-fade", begin + i * 38, 220)}>
                          {w}{" "}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Share: from another app, through Krovvi's share extension ─────────── */

function ShareApp({ name, children, press }: { name: string; children: ReactNode; press?: number }) {
  return (
    <span className="flex w-[66px] flex-col items-center gap-[6px]">
      <span className={press ? "seq" : ""} style={press ? seq(`k-press 380ms ${EASE} ${press}ms both`) : undefined}>
        {children}
      </span>
      <span className="text-[11px] text-[#EBEBF5]/60">{name}</span>
    </span>
  );
}

export function ShareScreen() {
  const pressAt = 1350;
  const savingAt = 1750;
  const savedAt = 2750;
  const goneAt = 3450;
  const pageAt = 3650;
  const summary = [
    { bullet: false, text: "You and Lina share the kids' week. She has them on Wednesdays and every other weekend." },
    { bullet: true, text: "The school trip form is due Friday. You said you'd sign it." },
    { bullet: true, text: "Summer camp is split, 600 each." },
  ];
  let t = pageAt + 900;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#000]">
      {/* The other app behind, in plain greys: a chat. */}
      <StatusBar />
      <div className="absolute inset-x-[14px] top-[120px] flex flex-col gap-[8px]">
        {[
          [false, 210],
          [true, 170],
          [false, 240],
          [false, 150],
          [true, 220],
          [false, 190],
          [true, 130],
        ].map(([mine, w], i) => (
          <span
            key={i}
            className={`h-[34px] rounded-[16px] ${mine ? "self-end bg-[#2b2b29]" : "bg-[#1a1a19]"}`}
            style={{ width: w as number }}
          />
        ))}
      </div>

      {/* The iOS share sheet for the exported chat. */}
      <div className="seq transient absolute inset-0 bg-black/40" style={seq(`k-fade 240ms ${EASE} 0ms both, k-hide 160ms linear ${savingAt - 150}ms forwards`)} />
      <div
        className="seq transient absolute inset-x-0 bottom-0 rounded-t-[14px] bg-[#1C1C1E] pb-[44px] pt-[14px]"
        style={seq(`k-sheet-up 320ms ${EASE} 100ms both, k-sheet-down 240ms ${EASE} ${savingAt - 250}ms forwards`)}
      >
        <div className="flex items-center gap-[12px] px-[16px]">
          <span className="flex h-[44px] w-[38px] flex-col items-center justify-center rounded-[6px] bg-[#e9e7e1]">
            <span className="h-[18px] w-[4px] rounded-[1px]" style={{ background: "repeating-linear-gradient(#8a8984 0 2px, #e9e7e1 2px 4px)" }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-white">WhatsApp Chat - Lina</span>
            <span className="block text-[13px] text-[#EBEBF5]/60">ZIP archive · 2.1 MB</span>
          </span>
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#3A3A3C]">
            <CrossGlyph size={11} color="#AEAEB2" weight={2} />
          </span>
        </div>
        <div className="mx-[16px] mt-[14px] h-[0.5px] bg-white/10" />
        <div className="mt-[16px] flex justify-between px-[12px]">
          <ShareApp name="Messages">
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-gradient-to-b from-[#5BF675] to-[#0CBD2A]">
              <svg width="32" height="30" viewBox="0 0 32 30" aria-hidden="true">
                <path d="M16 2C8.3 2 2 7.1 2 13.4c0 3.6 2 6.8 5.2 8.9-.3 2-1.3 3.9-2.7 5.2 3 0 5.7-1.2 7.6-3 1.2.3 2.5.4 3.9.4 7.7 0 14-5.1 14-11.4S23.7 2 16 2Z" fill="#fff" />
              </svg>
            </span>
          </ShareApp>
          <ShareApp name="Krovvi" press={pressAt}>
            <AppIcon size={60} />
          </ShareApp>
          <ShareApp name="Mail">
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-gradient-to-b from-[#1E9BFF] to-[#0A63E6]">
              <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true">
                <rect x="1" y="1" width="32" height="22" rx="3" fill="#fff" />
                <path d="M2 2.5 17 14 32 2.5" fill="none" stroke="#0A63E6" strokeWidth="1.6" />
              </svg>
            </span>
          </ShareApp>
          <ShareApp name="Notes">
            <span className="flex h-[60px] w-[60px] flex-col overflow-hidden rounded-[14px] bg-white">
              <span className="h-[16px] bg-gradient-to-b from-[#FFD84D] to-[#F7C600]" />
              <span className="mt-[8px] flex flex-col gap-[6px] px-[9px]">
                <span className="h-[2px] bg-[#d1d1d6]" />
                <span className="h-[2px] bg-[#d1d1d6]" />
                <span className="h-[2px] w-[60%] bg-[#d1d1d6]" />
              </span>
            </span>
          </ShareApp>
        </div>
        <div className="mx-[16px] mt-[18px] overflow-hidden rounded-[10px] bg-[#2C2C2E]">
          {["Copy", "Save to Files", "Add to Shared Album"].map((row, i) => (
            <div key={row}>
              {i > 0 && <div className="ml-[16px] h-[0.5px] bg-white/10" />}
              <div className="px-[16px] py-[12px] text-[16px] text-white">{row}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Krovvi's share extension: one small card over the other app, then it closes. */}
      <div
        className="seq transient absolute left-1/2 top-[426px] min-w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-card px-[24px] py-[18px] text-center text-[16px] font-medium text-ink opacity-0"
        style={seq(`k-on ${goneAt - savingAt}ms linear ${savingAt}ms`)}
      >
        <span className="relative inline-block">
          <span style={{ animation: `k-hide 1ms linear ${savedAt}ms forwards` }}>Saving to Krovvi…</span>
          <span className="absolute inset-0 whitespace-nowrap" style={{ animation: `k-show 160ms linear ${savedAt}ms both` }}>
            Saved to Krovvi
          </span>
        </span>
      </div>

      {/* Next time Krovvi is open: the chat's own page, its summary, never the messages. */}
      <div className="anim absolute inset-0 bg-ground" style={an("k-fade", pageAt, 320)}>
        <StatusBar />
        <ItemNav />
        <div className="absolute inset-x-[16px] top-[113px] flex flex-col gap-[16px]">
          <div className="flex items-center gap-[12px] rounded-[17px] bg-card p-[14px]">
            <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-card-hi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EDEDEB" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3.5c-4.9 0-8.5 3.2-8.5 7.2 0 2.1 1 4 2.7 5.3l-.7 3.8 3.9-2c.8.2 1.7.3 2.6.3 4.9 0 8.5-3.2 8.5-7.3S16.9 3.5 12 3.5Z" />
              </svg>
            </span>
            <span>
              <span className="block text-[15px] font-medium tracking-[-0.3px] text-ink">WhatsApp</span>
              <span className="block text-[12.5px] text-faint">1,204 messages</span>
            </span>
          </div>
          <div className="relative">
            <div className="anim px-[4px] pt-[4px] text-[24px] font-semibold leading-[30px] tracking-[-0.8px] text-ink" style={an("k-rise", pageAt + 500, 450)}>
              Lina
            </div>
            <div className="mt-[10px] flex flex-col gap-[10px] px-[4px]">
              {summary.map((line) => {
                const begin = t;
                t += line.text.split(" ").length * 36 + 150;
                return (
                  <div key={line.text} className="flex gap-[10px] text-[16px] leading-[23.2px] tracking-[-0.2px] text-ink">
                    {line.bullet && (
                      <span className="anim text-faint" style={an("k-fade", begin, 200)}>
                        •
                      </span>
                    )}
                    <span>
                      {line.text.split(" ").map((w, i) => (
                        <span key={i} className="anim" style={an("k-fade", begin + i * 36, 220)}>
                          {w}{" "}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

