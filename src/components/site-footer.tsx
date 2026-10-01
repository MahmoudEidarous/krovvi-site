import { SUPPORT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[var(--surface-hi)] pt-14 md:mt-36 md:pt-[72px]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-12 px-6 md:gap-14">
        <div>
          <h3 className="text-balance text-[26px] font-semibold tracking-[-0.02em]">The AI that knows your life.</h3>
          <p className="mt-3 max-w-[340px] text-[15px] leading-[1.6] text-[var(--muted)]">
            Krovvi remembers what people told you, keeps track of what you promised, and keeps up as plans change.
          </p>
        </div>
        <div className="flex gap-[clamp(48px,8vw,110px)]">
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[var(--faint)]">Krovvi</h4>
            <a href="/#how" className="mt-1 block py-1.5 text-[15px] text-[var(--soft)] no-underline hover:text-[var(--fg)]">
              How it works
            </a>
            <a href="/privacy" className="block py-1.5 text-[15px] text-[var(--soft)] no-underline hover:text-[var(--fg)]">
              Privacy
            </a>
            <a href="/support" className="block py-1.5 text-[15px] text-[var(--soft)] no-underline hover:text-[var(--fg)]">
              Support
            </a>
          </div>
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[var(--faint)]">Contact</h4>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-1 block py-1.5 text-[15px] text-[var(--soft)] no-underline hover:text-[var(--fg)]"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>

      <div className="relative mt-10 pb-2 md:mt-14">
        <div
          aria-hidden="true"
          className="giantfade select-none whitespace-nowrap text-center text-[clamp(96px,22.5vw,330px)] font-semibold leading-none tracking-[-0.03em] text-[#EDEDEB]/[0.09]"
        >
          krovvi
        </div>
      </div>

      <div className="px-6 pb-[max(28px,env(safe-area-inset-bottom))] text-center text-[12.5px] tracking-[0.04em] text-[var(--faint)]">
        &copy; 2026 Krovvi. All rights reserved.
      </div>
    </footer>
  );
}
