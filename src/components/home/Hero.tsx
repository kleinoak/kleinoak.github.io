import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/data/site";
import { teams } from "@/data/teams";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
        }}
      />
      <Container className="relative flex flex-col gap-8 py-20 sm:py-28 lg:flex-row lg:items-center lg:justify-between lg:py-32">
        <div className="max-w-2xl">
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
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Varsity, Junior Varsity, Flex, and Freshman volleyball at Klein Oak High School — built on
            discipline, teamwork, and Panther pride.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/schedule" variant="primary">
              View Schedule
            </Button>
            <Button href="/camps-tryouts" variant="ghost" className="border-white/40 text-white hover:bg-white/10">
              Camps &amp; Tryouts
            </Button>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-sm border border-white/15 bg-white/5 p-6 lg:max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
            Program Levels
          </p>
          <ul className="mt-3 space-y-2.5">
            {teams.map((team) => (
              <li key={team.slug}>
                <Link
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between rounded-sm border border-white/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide hover:border-accent"
                >
                  {team.name}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <p className="sr-only">{site.tagline} (prototype messaging)</p>
    </section>
  );
}
