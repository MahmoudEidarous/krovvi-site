import { Ask } from "@/components/sections/ask";
import { Closing } from "@/components/sections/closing";
import { Hero } from "@/components/sections/hero";
import { Inputs } from "@/components/sections/inputs";
import { Loop } from "@/components/sections/loop";
import { Moments } from "@/components/sections/moments";
import { Statement } from "@/components/sections/statement";
import { Story } from "@/components/sections/story";
import { Ticker } from "@/components/sections/ticker";
import { Trust } from "@/components/sections/trust";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="overflow-clip">
        <Hero />
        <Statement />
        <Ticker />
        <Story />
        <Moments />
        <Ask />
        <Inputs />
        <Loop />
        <Trust />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
