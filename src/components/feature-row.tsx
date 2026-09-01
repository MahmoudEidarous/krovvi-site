import { ParallaxY, Reveal } from "@/components/fx";
import { Phone } from "@/components/phone";

export function FeatureRow({ kicker, title, body, shot, alt, flip = false }: {
  kicker: string;
  title: string;
  body: string;
  shot: string;
  alt: string;
  flip?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-14 max-md:flex-col max-md:gap-14 max-md:text-center md:gap-[clamp(48px,7vw,96px)] ${
        flip ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <Reveal className="flex-1">
        <div className="mb-4 text-[13px] uppercase tracking-[0.22em] text-[var(--faint)]">
          {kicker}
        </div>
        <h2 className="text-[clamp(34px,4.8vw,52px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-4 max-w-[410px] text-[clamp(16px,2.2vw,19px)] leading-[1.65] text-[var(--muted)] max-md:mx-auto">
          {body}
        </p>
      </Reveal>
      <ParallaxY
        amount={70}
        className="relative shrink-0 basis-auto max-md:w-[min(300px,76vw)] md:basis-[min(380px,44%)]"
      >
        <div className="glow left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2" />
        <Reveal>
          <Phone shot={shot} alt={alt} />
        </Reveal>
      </ParallaxY>
    </div>
  );
}
