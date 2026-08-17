// One merged, date-ordered feed of everything on the program calendar.
//
// Two files feed it, with no overlap between them:
//   content/events.json  — program milestones (tryouts, rosters, pictures)
//   content/matches.json — every game, scrimmage, and tournament
//
// Keeping them separate means each date is asserted in exactly one place; this
// module is the only thing that has to know about both.
import { ProgramEvent, programEvents } from "@/data/events";
import { Match, MatchTimes, levelColumns, matches } from "@/data/matches";

export type LevelTime = { label: string; value: string };

export type CalendarEntry = {
  id: string;
  startDate: string;
  /** Free-form display date, e.g. "August 6" or "Aug 13–16". */
  date: string;
  time?: string;
  title: string;
  location?: string;
  /** Final day of a multi-day tournament; absent for single-day entries. */
  endDate?: string;
  status: "confirmed" | "tentative";
  /** Per-level start times, set only when the levels differ from each other. */
  levelTimes?: LevelTime[];
};

/**
 * A match carries four start times. When they are all the same string there is
 * nothing per-level to say, so it collapses to a single `time` and the card
 * renders as an ordinary event.
 */
function splitTimes(times: MatchTimes): Pick<CalendarEntry, "time" | "levelTimes"> {
  const values = levelColumns.map((column) => times[column.key]);
  const allSame = values.every((value) => value === values[0]);

  if (allSame) {
    return { time: values[0] || undefined };
  }

  return {
    levelTimes: levelColumns
      .map((column, index) => ({ label: column.shortLabel, value: values[index] }))
      .filter((entry) => entry.value),
  };
}

function fromMatch(match: Match): CalendarEntry {
  const times = Object.values(match.times);
  // With no explicit status, infer one: if every level still reads TBD there is
  // nothing to plan around yet, so badge it Tentative. An explicit `status` in
  // the content always wins — a fixture can be agreed long before its start
  // times are published.
  const allTbd = times.every((time) => !time || time.toUpperCase() === "TBD");

  return {
    id: match.id,
    startDate: match.startDate as string,
    endDate: match.endDate,
    date: match.date ?? "",
    title: match.opponent,
    location: match.location,
    status: match.status ?? (allTbd ? "tentative" : "confirmed"),
    ...splitTimes(match.times),
  };
}

function fromProgramEvent(event: ProgramEvent): CalendarEntry {
  return {
    id: event.id,
    startDate: event.startDate,
    date: event.date,
    time: event.time,
    title: event.title,
    location: event.location,
    status: event.status,
  };
}

/** Everything on the calendar, soonest first. Undated entries are omitted. */
export const calendar: CalendarEntry[] = [
  ...programEvents.map(fromProgramEvent),
  ...matches.filter((match) => match.startDate).map(fromMatch),
].sort((a, b) => a.startDate.localeCompare(b.startDate));

/**
 * Today's date in the program's timezone, as YYYY-MM-DD.
 *
 * Takes `now` so the same function serves the build (where it is the build
 * clock) and the browser (where it is the visitor's clock). Either way the date
 * is computed in America/Chicago, so a visitor in another timezone still sees
 * the schedule relative to the program's day, not their own.
 */
export function programDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(now);
}

/**
 * Entries that have not happened yet, soonest first. Pure: give it a date and
 * it gives you the list, which is what lets the browser re-run it.
 *
 * A multi-day tournament stays listed until its final day, so it does not drop
 * off the home page halfway through.
 */
export function upcomingFrom(
  entries: CalendarEntry[],
  today: string,
  limit?: number,
): CalendarEntry[] {
  const upcoming = entries.filter((entry) => (entry.endDate ?? entry.startDate) >= today);
  return limit === undefined ? upcoming : upcoming.slice(0, limit);
}

/**
 * The build-time view. This is what lands in the prerendered HTML, so it is
 * what a crawler and a visitor with JavaScript disabled see.
 *
 * It is only as fresh as the last build — hence the nightly rebuild in
 * deploy.yml, and hence `UpcomingEventsList` re-running the filter in the
 * browser against the real current date.
 */
export function upcomingCalendar(limit?: number): CalendarEntry[] {
  return upcomingFrom(calendar, programDate(), limit);
}
