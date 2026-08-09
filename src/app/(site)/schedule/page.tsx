import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventCard } from "@/components/cards/EventCard";
import { Button } from "@/components/ui/Button";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { programEvents } from "@/data/events";
import { matchSections, matchesInSection } from "@/data/matches";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Schedule" };

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
            </div>
            <Button href={site.rankOneScheduleUrl} variant="secondary" external>
              Open Rank One
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </section>

      {matchSections.map((section, index) => {
        const sectionMatches = matchesInSection(section.key);
        if (sectionMatches.length === 0) return null;

        return (
          <section
            key={section.key}
            aria-labelledby={`${section.key}-heading`}
            className={index % 2 === 0 ? "pb-12 sm:pb-16" : "bg-surface py-12 sm:py-16"}
          >
            <Container>
              <div id={`${section.key}-heading`}>
                <SectionHeading
                  eyebrow={`${sectionMatches.length} ${sectionMatches.length === 1 ? "date" : "dates"}`}
                  title={section.label}
                  description={section.description}
                />
              </div>
              <MatchSchedule
                matches={sectionMatches}
                caption={`${section.label} schedule with start times for Varsity, Junior Varsity, Flex and Freshman`}
              />
            </Container>
          </section>
        );
      })}

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
