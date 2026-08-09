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
  section: MatchSection;
  day?: string;
  date?: string;
  opponent: string;
  location?: string;
  times: MatchTimes;
  note?: string;
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
