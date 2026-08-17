"use client";

import { useEffect, useState } from "react";
import { EventCard } from "@/components/cards/EventCard";
import { CalendarEntry, programDate, upcomingFrom } from "@/data/calendar";

/**
 * The four soonest dates, re-checked against the real current date.
 *
 * The site is a static export, so the list baked into the HTML is only as
 * fresh as the last build. `deploy.yml` rebuilds nightly, which keeps it close
 * — but between midnight and that rebuild the page still advertises a fixture
 * that has already been played. That is exactly what was happening on the
 * morning of 2026-08-17: a tournament that finished on the 16th sat at the top
 * of the list.
 *
 * So: render the build-time list, then on mount re-run the same pure filter
 * against the browser's clock. Two properties matter and both are deliberate.
 *
 * - **The first render is identical to the server's.** `initial` is the state's
 *   starting value, so hydration matches and nothing flickers in the common
 *   case where the build is current.
 * - **JavaScript is not required.** With it disabled the prerendered list still
 *   renders — a day stale at worst, never empty — which keeps crawlers and
 *   no-JS readers whole.
 *
 * The date is computed in the program's timezone, not the visitor's, so
 * somebody reading from another state still sees the schedule relative to
 * Klein Oak's day.
 */
export function UpcomingEventsList({
  entries,
  initial,
  limit,
}: {
  /** Everything still upcoming as of the build, soonest first. */
  entries: CalendarEntry[];
  /** The build-time selection — what the server rendered. */
  initial: CalendarEntry[];
  limit: number;
}) {
  const [events, setEvents] = useState(initial);

  useEffect(() => {
    const refresh = () => setEvents(upcomingFrom(entries, programDate(), limit));

    refresh();

    // A page left open overnight — a phone on a bedside table, a laptop that
    // slept — would otherwise keep yesterday's list. Re-check when the tab is
    // brought back to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [entries, limit]);

  if (events.length === 0) {
    return (
      <p className="mt-10 text-base text-text-muted">
        No dates on the calendar right now — check the full schedule for match play.
      </p>
    );
  }

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
