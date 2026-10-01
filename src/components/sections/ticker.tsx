import { Play } from "@/components/app/ui";

/** Things people say out loud every day, as Krovvi catches them. Work and life, mixed on purpose. */
const ROW_ONE: Array<[string, string, string]> = [
  ["Task", "I'll send the quote by Thursday", "3:12"],
  ["Date", "Dinner at Mom's on Sunday at 7", "0:48"],
  ["Money", "Deposit paid: 2,000", "8:05"],
  ["Decision", "We go with the second design", "14:20"],
  ["Task", "Karim sends the contract tomorrow", "6:41"],
  ["Date", "The parent meeting moved to the 14th", "1:15"],
  ["Task", "Lina picks up the kids on Wednesday", "0:31"],
];
const ROW_TWO: Array<[string, string, string]> = [
  ["Task", "Call the landlord about the heater", "2:03"],
  ["Decision", "The launch moves to October 15", "7:40"],
  ["Money", "Rent goes up to 1,450 in March", "4:52"],
  ["Task", "Sara owns the final copy", "9:30"],
  ["Date", "Dentist on Friday at 10", "0:22"],
  ["Decision", "Omar books the review room", "11:02"],
  ["Money", "Half up front, half on delivery", "12:08"],
];

function Line({ kind, text, at }: { kind: string; text: string; at: string }) {
  return (
    <span className="flex shrink-0 items-center gap-4 rounded-[18px] bg-card px-5 py-[14px]">
      <span className="flex flex-col">
        <span className="text-[11.5px] font-semibold text-faint">{kind}</span>
        <span className="whitespace-nowrap text-[16px] text-soft">{text}</span>
      </span>
      <span className="flex items-center gap-[6px] rounded-full bg-card-hi px-[10px] py-[5px] text-[12.5px] text-faint tabular">
        <Play size={7} />
        {at}
      </span>
    </span>
  );
}

function Row({ items, seconds, reverse = false }: { items: Array<[string, string, string]>; seconds: number; reverse?: boolean }) {
  // Two copies side by side, moved by exactly one copy's width, loop without a seam.
  return (
    <div className="group flex overflow-hidden">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="ticker flex shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused]"
          style={{ animation: `${reverse ? "k-ticker-back" : "k-ticker"} ${seconds}s linear infinite` }}
        >
          {items.map(([k, t, at]) => (
            <Line key={t} kind={k} text={t} at={at} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <section aria-label="Things people say, as Krovvi catches them" className="relative pb-6">
      <div
        className="flex flex-col gap-3"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <Row items={ROW_ONE} seconds={70} />
        <Row items={ROW_TWO} seconds={80} reverse />
      </div>
    </section>
  );
}
