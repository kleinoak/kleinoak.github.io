// Content source: content/administration.json (edited at /admin).
//
// School staff above the volleyball program — athletic director, principal.
// Listed on the Coaches page under the coaching staff. Names come from the
// program's published 2026-27 schedule.
import administrationJson from "@content/administration.json";

export type Administrator = {
  name: string;
  title: string;
};

export const administration: Administrator[] = administrationJson;
