/** Things people say out loud every day, as Krovvi files them. Work and life, mixed on purpose. */
const ROW_ONE: Array<[string, string]> = [
  ["I'll send the quote by Thursday", "Task"],
  ["Dinner at Mom's on Sunday at 7", "Date"],
  ["Deposit paid: 2,000", "Money"],
  ["We go with the second design", "Decision"],
  ["Karim sends the contract tomorrow", "Task"],
  ["The parent meeting moved to the 14th", "Date"],
  ["Lina picks up the kids on Wednesday", "Task"],
];
const ROW_TWO: Array<[string, string]> = [
  ["Call the landlord about the heater", "Task"],
  ["The launch moves to October 15", "Decision"],
  ["Rent goes up to 1,450 in March", "Money"],
  ["Sara owns the final copy", "Task"],
  ["Dentist on Friday at 10", "Date"],
  ["Half up front, half on delivery", "Money"],
  ["Omar books the review room", "Task"],
];

function Row({ items, seconds, reverse = false, dim = false }: {
  items: Array<[string, string]>;
  seconds: number;
  reverse?: boolean;
  dim?: boolean;
}) {
  // Two copies side by side, moved by exactly one copy's width, loop without a seam.
  return (
    <div className="flex overflow-hidden">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="ticker flex shrink-0 items-baseline gap-14 pr-14"
          style={{ animation: `${reverse ? "k-ticker-back" : "k-ticker"} ${seconds}s linear infinite` }}
        >
          {items.map(([text, tag]) => (
            <span key={text} className="flex shrink-0 items-baseline gap-3 whitespace-nowrap">
              <span className={`text-[clamp(20px,2.4vw,30px)] font-medium tracking-[-0.02em] ${dim ? "text-faint" : "text-soft"}`}>
                {text}
              </span>
              <span className="text-[13px] text-faint">{tag}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <section aria-label="Things people say, as Krovvi files them" className="relative pb-6">
      <div
        className="flex flex-col gap-5"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 14%, black 86%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 14%, black 86%, transparent)",
        }}
      >
        <Row items={ROW_ONE} seconds={75} />
        <Row items={ROW_TWO} seconds={90} reverse dim />
      </div>
    </section>
  );
}
