// Content sources: content/teams.json, content/coaches.json (edited at /admin).
//
// Rosters were transcribed from the program's previous website, which lived at
// kleinoakvolleyball.com until this site took that domain over — so that address
// is no longer an independent source to check against. Rosters have no external
// source now; only the program can confirm them. No statistics, jersey numbers,
// or player photos are modeled, because none were published.
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
   * Student names. Only publish a roster the program has already made public,
   * and note that the old public source is gone (see the file header), so an
   * addition can no longer be verified against a page — only with the program.
   */
  roster?: string[];
};

export type CoachPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Coach = {
  name: string;
  title: string;
  /**
   * The coach's own words, as the program supplied them. Transcribed rather
   * than written here — see PROJECT-LOG.
   */
  bio?: string;
  /**
   * A portrait the coach chose. Masked to a circle, so it is rendered without
   * any further cropping; see `scripts/`-adjacent notes in PROJECT-LOG for how
   * these were lifted out of the program's slide deck.
   */
  photo?: CoachPhoto;
  /**
   * The publish switch, kept separate from `bio` on purpose: turning it off
   * pulls a bio off the site without deleting the text, which is what a coach
   * asking for theirs to come down actually needs.
   */
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
