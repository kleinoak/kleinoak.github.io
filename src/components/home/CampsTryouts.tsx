import { CalendarCheck, DollarSign, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { camps, tryouts } from "@/data/camps";

export function CampsTryouts() {
  return (
    <section aria-labelledby="camps-heading" className="bg-primary py-16 text-white sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div id="camps-heading">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-accent">
              2026 Season
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Camps &amp; Tryouts
            </h2>
            <p className="mt-3 max-w-2xl text-base text-white/70 sm:text-lg">
              Every path into Panther Volleyball starts here — from youth camps to varsity
              tryouts.
            </p>
          </div>
          <Button href="/camps-tryouts" variant="primary">
            Full Details
          </Button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/60">
              <DollarSign aria-hidden="true" className="h-4 w-4" />
              Camp Opportunities
            </h3>
            <ul className="mt-4 space-y-3">
              {camps.map((camp) => (
                <li
                  key={camp.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-white/15 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{camp.name}</p>
                    <p className="text-xs text-white/60">{camp.dates}</p>
                  </div>
                  <span className="font-display text-sm font-bold text-accent">{camp.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/60">
              <CalendarCheck aria-hidden="true" className="h-4 w-4" />
              Tryout Dates
            </h3>
            <ul className="mt-4 space-y-3">
              {tryouts.map((tryout) => (
                <li
                  key={tryout.group}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-white/15 px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Users aria-hidden="true" className="h-4 w-4 text-accent" />
                    {tryout.group}
                  </span>
                  <span className="text-sm text-white/70">{tryout.dates}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/50">
              Rosters posted August 3 at 8:00 PM · First practice August 4
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
