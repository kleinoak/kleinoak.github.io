// Content sources: content/sponsor-tiers.json, content/sponsor-steps.json
// (edited at /admin).
import sponsorTiersJson from "@content/sponsor-tiers.json";
import sponsorStepsJson from "@content/sponsor-steps.json";

export type SponsorTier = {
  id: string;
  name: string;
  price: string;
  sponsors: string[];
};

export const sponsorTiers: SponsorTier[] = sponsorTiersJson;
export const sponsorSteps: string[] = sponsorStepsJson.steps;
