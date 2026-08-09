// Content source: content/events.json (edited at /admin).
//
// These are program-wide key dates, NOT a full match-by-match schedule — the
// live site does not publish one in a readable format (it embeds a single
// schedule image). Game-by-game opponents/times should be sourced from Klein
// ISD's Rank One system, see the Schedule page.
import eventsJson from "@content/events.json";

export type ProgramEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  status: "confirmed" | "tentative";
  verified: boolean;
};

export const programEvents = eventsJson as ProgramEvent[];
