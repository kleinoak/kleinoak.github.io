// Content source: content/matches.json (edited at /admin).
//
// Transcribed from the program's published 2026 schedule at
// kleinoakvolleyball.com (2026-08-08). Rank One remains the live source of
// truth for changes — the schedule page links to it prominently.
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
   * Varsity result, from the program's Rank One page — "W 3–0", "L 0–2", or a
   * record like "5–1" for a tournament played across several matches.
   *
   * Varsity only: Rank One publishes results per team, and the schedule links
   * to the varsity calendar. A blank here means no result has been posted, not
   * that the match was lost or cancelled, so nothing is inferred from absence.
   */
  result?: string;
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
