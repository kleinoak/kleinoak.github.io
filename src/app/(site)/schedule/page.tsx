import type { Metadata } from "next";
import { ExternalLink, RefreshCw } from "lucide-react";
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

/**
 * "Aug 25, 2026" from a YYYY-MM-DD string, without letting the runtime read it
 * as UTC midnight and print the day before in Central time. Parsed by hand for
 * that reason rather than through `new Date(string)`.
 */
function formatCheckedDate(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const lastChecked = site.scheduleUpdated ? formatCheckedDate(site.scheduleUpdated) : null;

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
          <div className="flex flex-col gap-6 rounded-sm border border-accent-strong/40 bg-accent/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
                Live Match Schedule
              </h2>
              <p className="mt-1 max-w-xl text-sm text-text-muted">
                Rank One is Klein ISD&apos;s official scheduling system and the most accurate
                source for changes — with the ability to sync games to your personal calendar.
              </p>
              {/* Only the hand-reconciled half is left here; the automated half
                  is in SyncStatus at the foot of the page. Keeping both would
                  have said the same thing twice in two different formats. */}
              {lastChecked && (
                <p className="mt-3 flex items-start gap-2 text-xs text-text-muted">
                  <RefreshCw aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" />
                  <span>
                    Start times and tournament records are reconciled by hand — last done on{" "}
                    <time dateTime={site.scheduleUpdated}>{lastChecked}</time>.
                  </span>
                </p>
              )}
            </div>
            <Button href={site.rankOneScheduleUrl} variant="secondary" external>
              Open Rank One
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </Button>
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

      {/* The sync stamp closes the page rather than opening it. It is a
          provenance note — "where did this come from, and how old is it" — and
          a reader asks that after reading the schedule, not before. At the top
          it also competed with the Rank One callout, which is the thing a
          parent actually needs to act on when a time changes late in the week. */}
      <section aria-label="Schedule data freshness" className="py-10 sm:py-12">
        <Container>
          <SyncStatus />
        </Container>
      </section>
    </>
  );
}
