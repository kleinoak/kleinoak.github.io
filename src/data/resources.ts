// Content sources: content/resources.json, content/booster-board.json
// (edited at /admin).
import resourcesJson from "@content/resources.json";
import boosterBoardJson from "@content/booster-board.json";

export type Resource = {
  id: string;
  title: string;
  description: string;
  href?: string;
  verified: boolean;
  note?: string;
};

export type BoosterOfficer = {
  role: string;
  name: string;
};

export const resources = resourcesJson as Resource[];
export const boosterBoard: BoosterOfficer[] = boosterBoardJson;
