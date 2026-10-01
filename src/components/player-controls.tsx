"use client";

/**
 * The film's controls, as Apple puts them under a demo: one short name per
 * scene with a thin bar that fills while it plays, and a pause button.
 * Tapping a name plays that scene from the start.
 */
export function PlayerControls({
  names,
  active,
  epoch,
  duration,
  paused,
  onPick,
  onToggle,
  toggle = true,
}: {
  names: string[];
  active: number;
  /** Changes every time a scene starts, so its bar starts empty again. */
  epoch: number;
  /** How long the active scene plays, in ms. */
  duration: number;
  paused: boolean;
  onPick: (index: number) => void;
  onToggle: () => void;
  /** Off when motion is reduced: nothing plays, so there is nothing to pause. */
  toggle?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <div className="flex items-center gap-[2px] rounded-full bg-card/80 p-[4px] backdrop-blur-md">
        {names.map((name, i) => {
          const on = i === active;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onPick(i)}
              aria-pressed={on}
              className={`relative cursor-pointer overflow-hidden whitespace-nowrap rounded-full px-[11px] py-[8px] text-[12.5px] font-medium transition-colors duration-300 sm:px-[14px] sm:text-[13px] ${
                on ? "bg-card-hi text-ink" : "text-faint hover:text-soft"
              }`}
            >
              {name}
              {on && (
                <span className="absolute inset-x-[11px] bottom-[4px] h-[2px] overflow-hidden rounded-full bg-white/10 sm:inset-x-[14px]">
                  <span
                    key={epoch}
                    className="block h-full origin-left rounded-full bg-ink/80"
                    style={{
                      animation: `k-grow-x ${duration}ms linear both`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {toggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={paused ? "Play" : "Pause"}
          className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-card/80 text-ink backdrop-blur-md transition-colors hover:bg-card-hi"
        >
          {paused ? (
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
              <path
                d="M1 1.2v11.6c0 .6.7 1 1.2.7l9.3-5.8c.5-.3.5-1 0-1.4L2.2.5C1.7.2 1 .6 1 1.2Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="3.4"
                height="12"
                rx="1.2"
                fill="currentColor"
              />
              <rect
                x="7.6"
                y="1"
                width="3.4"
                height="12"
                rx="1.2"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
