// Content source: content/matches.json (edited at /admin).
//
// Transcribed from the program's published 2026 schedule (2026-08-08), then
// reconciled against Rank One on 2026-08-17 and again on 2026-08-25 — the
// second pass against all four team calendars rather than varsity alone, which
// is where the per-level results and start times come from. Rank One remains
// the live source of truth for changes; the schedule page links to it and
// shows when it was last checked (`site.scheduleUpdated`). Note that
// kleinoakvolleyball.com, the original reference, is now this site.
//
// Each level has its own Rank One calendar, and a level missing from its own
// feed on a date is not playing that date — which is why some entries carry
// "x" rather than a time.
import matchesJson from "@content/matches.json";

export type MatchSection = "preseason" | "district" | "playoffs";

export type MatchTimes = {
  varsity: string;
  jv: string;
  flex: string;
  freshmen: string;
};

export type Match = {
  id: string;
  /**
   * Sortable ISO date (YYYY-MM-DD); `endDate` is set only for multi-day
   * tournaments. `date`/`day` stay the free-form display strings. Optional
   * because the program has published one entry with no date yet.
   */
  startDate?: string;
  endDate?: string;
  section: MatchSection;
  day?: string;
  date?: string;
  opponent: string;
  location?: string;
  times: MatchTimes;
  note?: string;
  /**
   * Overrides the status the home page would otherwise infer from `times`.
   * Set it when a fixture is agreed but its start times are not yet published —
   * "TBD times" and "might not happen" are different things, and only the
   * program knows which one applies.
   */
  status?: "confirmed" | "tentative";
  /**
   * Results, per level — "W 3–0", "L 0–2", or a record like "9–0" for a
   * tournament the site keeps as one row but Rank One lists as several
   * matches.
   *
   * Rank One publishes results per team, so a level appears here only when its
   * own calendar posts one: as of 2026-08-25 that is varsity and JV, while
   * flex and freshman calendars carry no scores at all. A missing level means
   * **no result has been posted** — never a loss, never a cancellation — so
   * nothing is inferred from absence.
   */
  results?: Partial<Record<keyof MatchTimes, string>>;
};

export const matches = matchesJson as Match[];

export const matchSections: { key: MatchSection; label: string; description: string }[] = [
  {
    key: "preseason",
    label: "Preseason",
    description: "Scrimmages, tournaments, and the start of the daily practice schedule.",
  },
  {
    key: "district",
    label: "District Season",
    description: "District matches and invitational tournaments.",
  },
  {
    key: "playoffs",
    label: "Playoffs",
    description: "Postseason rounds. Lower levels attend to support Varsity.",
  },
];

export function matchesInSection(section: MatchSection): Match[] {
  return matches.filter((match) => match.section === section);
}

/** Column order used everywhere the schedule is rendered. */
export const levelColumns: { key: keyof MatchTimes; label: string; shortLabel: string }[] = [
  { key: "varsity", label: "Varsity", shortLabel: "V" },
  { key: "jv", label: "Junior Varsity", shortLabel: "JV" },
  { key: "flex", label: "Flex", shortLabel: "Flex" },
  { key: "freshmen", label: "Freshman", shortLabel: "F" },
];
