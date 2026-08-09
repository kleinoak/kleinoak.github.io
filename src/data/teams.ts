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

export const teams = teamsJson as Team[];
export const coaches: Coach[] = coachesJson;
