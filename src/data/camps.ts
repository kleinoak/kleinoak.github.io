// Content sources: content/camps.json, content/tryouts.json,
// content/tryout-milestones.json (edited at /admin).
//
// Registration happens through Klein ISD's Rank One camp store, linked from
// the Camps & Tryouts page — not reproduced or re-hosted here.
import campsJson from "@content/camps.json";
import tryoutsJson from "@content/tryouts.json";
import milestonesJson from "@content/tryout-milestones.json";

export type Camp = {
  id: string;
  name: string;
  audience: string;
  dates: string;
  price: string;
};

export type TryoutInfo = {
  group: string;
  dates: string;
};

export type TryoutMilestone = {
  label: string;
  detail: string;
};

export const camps: Camp[] = campsJson;
export const tryouts: TryoutInfo[] = tryoutsJson;
export const tryoutMilestones: TryoutMilestone[] = milestonesJson;
