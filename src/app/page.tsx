import { Bento } from "@/components/sections/bento";
import { Closing } from "@/components/sections/closing";
import { Hero } from "@/components/sections/hero";
import { Loop } from "@/components/sections/loop";
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
        <Bento />
        <Story />
        <Loop />
        <Trust />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
