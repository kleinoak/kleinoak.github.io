import Image from "next/image";
import { assetPath } from "@/lib/asset";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* `lg:justify-center`: the logo and the text column together are
          narrower than the container, and without it the row packs to the left
          and leaves a dead band of black down the right-hand side. */}
      {/* `pb-20` on every breakpoint is the carousel's control lane — see the
          note in HeroCarousel. The hero is the slide that needs it: its buttons
          run to the foot of the section, and at the old `py` the dot-and-pause
          pill sat on top of "View Schedule" on a phone and cleared it by four
          pixels on a tablet. */}
      <Container className="relative flex flex-col items-center justify-center gap-5 pt-8 pb-20 sm:gap-8 sm:pt-12 lg:flex-row lg:gap-12 lg:pt-14">
        <Image
          src={assetPath("/images/brand/panther-logo.png")}
          alt="Klein Oak Panthers Volleyball"
          width={695}
          height={646}
          priority
          sizes="(min-width: 1024px) 19rem, (min-width: 640px) 11rem, 9rem"
          // The mark only sits beside the text at `lg`. Below that it is
          // stacked above it, where every pixel of logo is a pixel the two
          // banner slides have to letterbox to match — so it stays modest until
          // the row layout gives it somewhere to go.
          className="w-36 flex-none sm:w-44 lg:w-[19rem]"
        />

        <div className="max-w-2xl text-center lg:text-left">
          {/* Tighter letter-spacing below `sm`: at the desktop tracking this
              line wraps to two on a phone, and a 2-line eyebrow above a 3-line
              headline is 20px of the hero spent on the smallest text in it. */}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent sm:text-sm sm:tracking-[0.2em]">
            Klein Oak High School · Panther Volleyball
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl">
            Compete Together.
            <br />
            Grow Together.
            <br />
            <span className="text-accent">Win Together.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/75 max-lg:mx-auto">
            Varsity, Junior Varsity, Flex, and Freshman volleyball at Klein Oak High School — built on
            discipline, teamwork, and Panther pride.
          </p>
          {/* Two equal columns on a phone rather than a wrapping flex row.
              Side by side the pair does not fit at 390px, so they stacked into
              two rows — 102px where one row is 48px, on the slide that sets the
              carousel's height. Full-width cells are also the better tap
              target. Flex from `sm` up, where they fit on one line intrinsically
              and equal halves would look arbitrary. */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
            <Button href="/schedule" variant="primary" className="w-full max-sm:px-3 sm:w-auto">
              View Schedule
            </Button>
            <Button
              href="/teams"
              variant="ghost"
              className="w-full border-white/40 text-white hover:bg-white/10 max-sm:px-3 sm:w-auto"
            >
              Teams &amp; Rosters
            </Button>
          </div>
        </div>
      </Container>
      <p className="sr-only">{site.tagline}</p>
    </section>
  );
}
