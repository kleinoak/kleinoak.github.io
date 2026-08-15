// Content sources: content/teams.json, content/coaches.json (edited at /admin).
//
// Rosters mirror the 2026 rosters the program publishes at
// kleinoakvolleyball.com. No statistics, jersey numbers, or player photos are
// published there, so none are modeled here.
import teamsJson from "@content/teams.json";
import coachesJson from "@content/coaches.json";

export type TeamPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Team = {
  slug: string;
  name: string;
  level: string;
  description: string;
  photo?: TeamPhoto;
  /**
   * Published by the program at kleinoakvolleyball.com. Student names, so this
   * mirrors what the program has already made public — nothing more.
   */
  roster?: string[];
};

export type Coach = {
  name: string;
  title: string;
  bioAvailable: boolean;
};

/**
 * Alphabetical by first name — how a parent actually scans a roster for their
 * daughter. Ties fall back to the full name so ordering is stable.
 *
 * `localeCompare` rather than `<`, so the typographic apostrophe in a name like
 * "Ra’Leigh" and any accented character sort where a reader expects, instead of
 * by code point. `sensitivity: "base"` keeps case and accents from deciding the
 * order.
 */
function byFirstName(a: string, b: string): number {
  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
  return (
    firstName(a).localeCompare(firstName(b), "en", { sensitivity: "base" }) ||
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

/**
 * Rosters are sorted here rather than relying on the order in the JSON, so a
 * player added at the bottom of the list in /admin still appears in the right
 * place on the site. The stored file is kept in the same order anyway, so the
 * editor shows what the page will show.
 */
export const teams: Team[] = (teamsJson as Team[]).map((team) =>
  team.roster ? { ...team, roster: [...team.roster].sort(byFirstName) } : team,
);

export const coaches: Coach[] = coachesJson;
