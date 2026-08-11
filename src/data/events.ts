// Content source: content/events.json (edited at /admin).
//
// These are program-wide key dates, NOT a full match-by-match schedule — the
// live site does not publish one in a readable format (it embeds a single
// schedule image). Game-by-game opponents/times should be sourced from Klein
// ISD's Rank One system, see the Schedule page.
import eventsJson from "@content/events.json";

export type ProgramEvent = {
  id: string;
  /**
   * Sortable ISO date (YYYY-MM-DD) used for ordering and for deciding what is
   * still upcoming. `date` stays the free-form display string, because a single
   * event can span days ("August 1 & 3"); startDate is the first of them.
   */
  startDate: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  status: "confirmed" | "tentative";
  verified: boolean;
};

export const programEvents = [...(eventsJson as ProgramEvent[])].sort((a, b) =>
  a.startDate.localeCompare(b.startDate),
);

/**
 * "Today" in the program's own timezone. en-CA formats as YYYY-MM-DD, so this
 * compares directly against startDate. Using America/Chicago rather than UTC
 * keeps an event listed for the whole of its local day.
 *
 * NOTE: the site is a static export (next.config.ts `output: "export"`), so
 * this is evaluated at BUILD time, not when a visitor loads the page. The list
 * refreshes on each rebuild/deploy, not on its own overnight.
 *
 * Used by @/data/calendar to decide what is still upcoming.
 */
export function programToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}
