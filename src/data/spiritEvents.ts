// Content source: content/spirit-events.json (edited at /admin).
//
// The spirit calendar: what to wear, what to bring, and who is being honoured.
// It deliberately does NOT hold start times or results — that is the schedule's
// job, and a date that exists in two files with two different times is the bug
// this separation avoids. Every fixture here was checked against
// content/matches.json when it was written: same date, same opponent, same
// home/away, all thirteen.
import spiritEventsJson from "@content/spirit-events.json";

export type SpiritTone = "gold" | "white" | "black";

export type SpiritEvent = {
  id: string;
  /** Real calendar date, YYYY-MM-DD. Drives the "has this passed?" filter. */
  startDate: string;
  /** Last day, for the multi-day drive. */
  endDate?: string;
  /** Free-form display date, e.g. "September 8" or "September 21–25". */
  date: string;
  kind: "game" | "spirit-night" | "drive";
  homeAway?: "home" | "away";
  opponent?: string;
  /** Used by anything that is not a fixture. */
  title?: string;
  /** "Gold Out", "White Hot", "Black Out", "White Out". */
  themeLabel?: string;
  /** Which colour the theme actually is — the label alone cannot be styled. */
  themeTone?: SpiritTone;
  /** "Senior Night", "Teacher Appreciation Night", … */
  occasion?: string;
  /** The rally cry on an away game, or the call on a drive. */
  rally?: string;
  detail: string;
  location?: string;
  time?: string;
  /** Ties this to the announcement card that carries the flyer. */
  announcementId?: string;
};

export const spiritEvents: SpiritEvent[] = spiritEventsJson as SpiritEvent[];

/** What a fixture is called on the card. */
export function spiritTitle(event: SpiritEvent): string {
  if (event.title) return event.title;
  if (!event.opponent) return "";
  return `${event.homeAway === "away" ? "at" : "vs"} ${event.opponent}`;
}

/**
 * Still to come, soonest first — the same rule the calendar uses, and pure for
 * the same reason: it runs once at build and again in the browser.
 *
 * A multi-day entry stays listed until its final day, so the pantry drive does
 * not vanish on the Tuesday of the week it is running.
 */
export function upcomingSpiritEvents(
  events: SpiritEvent[],
  today: string,
): SpiritEvent[] {
  return events
    .filter((event) => (event.endDate ?? event.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export type SpiritMonth = { key: string; label: string; events: SpiritEvent[] };

/**
 * Grouped into the months the program's own list used, because "SEPTEMBER" and
 * "OCTOBER" are how a parent scans for the night they care about. Derived from
 * `startDate` rather than stored, so a month heading cannot disagree with the
 * dates under it.
 */
export function groupByMonth(events: SpiritEvent[]): SpiritMonth[] {
  const months: SpiritMonth[] = [];
  for (const event of events) {
    const key = event.startDate.slice(0, 7);
    let month = months.find((m) => m.key === key);
    if (!month) {
      const [year, mm] = key.split("-");
      month = {
        key,
        label: new Date(Number(year), Number(mm) - 1, 1).toLocaleDateString("en-US", {
          month: "long",
        }),
        events: [],
      };
      months.push(month);
    }
    month.events.push(event);
  }
  return months;
}
