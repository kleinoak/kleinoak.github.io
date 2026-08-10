"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchSchedule } from "@/components/schedule/MatchSchedule";
import { levelColumns, type Match, type MatchTimes } from "@/data/matches";

type LevelKey = keyof MatchTimes;
type Filter = "all" | LevelKey;

export type ScheduleSection = {
  key: string;
  label: string;
  description: string;
  matches: Match[];
};

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All Teams" },
  ...levelColumns.map((column) => ({ value: column.key as Filter, label: column.label })),
];

/**
 * "x" in a level's time cell means that level is not playing that date. An
 * empty cell means no time was published — the date may still be theirs, so
 * it stays visible rather than being quietly dropped.
 */
function isPlaying(match: Match, level: LevelKey) {
  return match.times[level].trim().toLowerCase() !== "x";
}

/**
 * The season schedule with a team filter.
 *
 * Default is every level side by side — the view the program publishes. Picking
 * one team narrows every section to that team's dates and start times, which is
 * what a parent following a single level actually needs.
 *
 * Filtering is client-side rather than a route per team, so switching is
 * instant and the full schedule stays in the prerendered HTML — a per-team URL
 * would either need a Suspense boundary (which empties that HTML) or five near
 * duplicate pages. The cost is that a filtered view is not linkable.
 *
 * Native radios drive the control, so arrow keys, focus, and screen-reader
 * semantics come for free.
 */
export function ScheduleBrowser({ sections }: { sections: ScheduleSection[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const level = filter === "all" ? undefined : filter;
  const activeLabel = filters.find((entry) => entry.value === filter)?.label ?? "All Teams";

  const visible = sections
    .map((section) => ({
      ...section,
      shown: level ? section.matches.filter((match) => isPlaying(match, level)) : section.matches,
    }))
    .filter((section) => section.shown.length > 0);

  const total = visible.reduce((count, section) => count + section.shown.length, 0);
  const hidden = sections.reduce((count, section) => count + section.matches.length, 0) - total;

  return (
    <>
      <section aria-labelledby="schedule-filter-heading" className="pb-2">
        <Container>
          <fieldset>
            <legend id="schedule-filter-heading" className="text-sm font-semibold uppercase tracking-[0.15em] text-text-muted">
              Show schedule for
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.map((entry) => (
                <label key={entry.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="schedule-team"
                    value={entry.value}
                    checked={filter === entry.value}
                    onChange={() => setFilter(entry.value)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:border-accent-strong peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-strong">
                    {entry.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p aria-live="polite" className="mt-4 text-sm text-text-muted">
            {level ? (
              <>
                Showing <span className="font-semibold text-primary">{activeLabel}</span> only —{" "}
                {total} {total === 1 ? "date" : "dates"}.
                {hidden > 0 && ` ${hidden} ${hidden === 1 ? "date" : "dates"} where ${activeLabel} is not playing ${hidden === 1 ? "is" : "are"} hidden.`}
              </>
            ) : (
              <>Showing all four levels — {total} {total === 1 ? "date" : "dates"}.</>
            )}
          </p>
        </Container>
      </section>

      {visible.length === 0 ? (
        <section className="py-12 sm:py-16">
          <Container>
            <EmptyState
              title={`No dates listed for ${activeLabel}`}
              description="Nothing has been published for this level yet. Rank One carries any late additions."
            />
          </Container>
        </section>
      ) : (
        visible.map((section, index) => (
          <section
            key={section.key}
            aria-labelledby={`${section.key}-heading`}
            className={index % 2 === 0 ? "py-12 sm:py-16" : "bg-surface py-12 sm:py-16"}
          >
            <Container>
              <div id={`${section.key}-heading`}>
                <SectionHeading
                  eyebrow={`${section.shown.length} ${section.shown.length === 1 ? "date" : "dates"}`}
                  title={section.label}
                  description={section.description}
                />
              </div>
              <MatchSchedule
                matches={section.shown}
                level={level}
                caption={
                  level
                    ? `${section.label} schedule with ${activeLabel} start times`
                    : `${section.label} schedule with start times for Varsity, Junior Varsity, Flex and Freshman`
                }
              />
            </Container>
          </section>
        ))
      )}
    </>
  );
}
