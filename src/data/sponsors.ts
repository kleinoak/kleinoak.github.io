// Content sources: content/sponsor-tiers.json, content/sponsor-steps.json,
// content/sponsor-logos.json (edited at /admin).
import sponsorTiersJson from "@content/sponsor-tiers.json";
import sponsorStepsJson from "@content/sponsor-steps.json";
import sponsorLogosJson from "@content/sponsor-logos.json";

export type SponsorTier = {
  id: string;
  name: string;
  price: string;
  sponsors: string[];
};

export type SponsorLogo = {
  /** Must match the business name exactly as it appears in a tier's `sponsors`. */
  name: string;
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export const sponsorTiers: SponsorTier[] = sponsorTiersJson;
export const sponsorSteps: string[] = sponsorStepsJson.steps;
export const sponsorLogos: SponsorLogo[] = sponsorLogosJson;

/**
 * Logos are kept in their own file, keyed by business name, rather than nested
 * inside each tier: a tier's `sponsors` is a `stringList` in the CMS, which
 * cannot hold objects. This keeps /admin able to edit both.
 *
 * A sponsor with no entry here simply renders as its name, so adding a business
 * to a tier never depends on having its artwork to hand.
 */
const logosByName = new Map(sponsorLogos.map((logo) => [logo.name, logo]));

export function sponsorLogoFor(name: string): SponsorLogo | undefined {
  return logosByName.get(name);
}
