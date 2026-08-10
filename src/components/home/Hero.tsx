import Image from "next/image";
import { assetPath } from "@/lib/asset";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <Container className="relative flex flex-col items-center gap-10 py-20 sm:py-24 lg:flex-row lg:gap-14 lg:py-28">
        <Image
          src={assetPath("/images/brand/panther-logo.png")}
          alt="Klein Oak Panthers Volleyball"
          width={695}
          height={646}
          priority
          sizes="(min-width: 1024px) 26rem, (min-width: 640px) 20rem, 18rem"
          className="w-72 flex-none sm:w-80 lg:w-[26rem]"
        />

        <div className="max-w-2xl text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Klein Oak High School · Panther Volleyball
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
            Compete Together.
            <br />
            Grow Together.
            <br />
            <span className="text-accent">Win Together.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/75 max-lg:mx-auto">
            Varsity, Junior Varsity, Flex, and Freshman volleyball at Klein Oak High School — built on
            discipline, teamwork, and Panther pride.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Button href="/schedule" variant="primary">
              View Schedule
            </Button>
            <Button href="/camps-tryouts" variant="ghost" className="border-white/40 text-white hover:bg-white/10">
              Camps &amp; Tryouts
            </Button>
          </div>
        </div>
      </Container>
      <p className="sr-only">{site.tagline} (prototype messaging)</p>
    </section>
  );
}
