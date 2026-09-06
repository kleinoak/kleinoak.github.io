import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { EventCard } from "@/components/cards/EventCard";
import { Button } from "@/components/ui/Button";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { programEvents } from "@/data/events";
import { matchSections, matchesInSection } from "@/data/matches";
import { site } from "@/data/site";
import { SyncStatus } from "@/components/schedule/SyncStatus";

export const metadata: Metadata = { title: "Schedule" };

const scheduleSections = matchSections
  .map((section) => ({ ...section, matches: matchesInSection(section.key) }))
  .filter((section) => section.matches.length > 0);

export default function SchedulePage() {
  return (
    <>
      <PageHero
        eyebrow="2026 Season"
        title="Schedule"
        description="Preseason, district, and playoff dates for all four levels. Times can change late in the week — Rank One is always the live source of truth."
      />

      <section className="py-12 sm:py-16">
        <Container>
          {/* One panel: what the live source is, the way to it, and when it was
              last read. The sync stamp used to close the page instead, on the
              reasoning that provenance is something a reader asks *after* the
              schedule. In practice it stranded the answer a thousand pixels
              below the question — a parent reading "times can change late in the
              week" wants "and we checked at 12:32 today" in the same glance, not
              past the fixtures and the program dates. */}
          <div className="rounded-sm border border-accent-strong/40 bg-accent/10">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
                  Live Match Schedule
                </h2>
                <p className="mt-1 max-w-xl text-sm text-text-muted">
                  Rank One is Klein ISD&apos;s official scheduling system and the most accurate
                  source for changes — with the ability to sync games to your personal calendar.
                </p>
              </div>
              {/* `sm:shrink-0` once it is beside the copy: without it the
                  paragraph's `max-w-xl` wins the row at tablet width and squeezes
                  the button until "Open Rank One" breaks across two lines. */}
              <Button
                href={site.rankOneScheduleUrl}
                variant="secondary"
                external
                className="sm:shrink-0 sm:whitespace-nowrap"
              >
                Open Rank One
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>

            {/* Supplies no chrome of its own — it is the panel's bottom band. */}
            <SyncStatus />
          </div>
        </Container>
      </section>

      <ScheduleBrowser sections={scheduleSections} />

      <section aria-labelledby="program-dates-heading" className="bg-primary py-16 sm:py-20">
        <Container>
          <div id="program-dates-heading">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-accent">
              Confirmed
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
              Program Dates
            </h2>
            <p className="mt-3 max-w-2xl text-base text-white/70 sm:text-lg">
              Team-wide dates outside of match play.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
