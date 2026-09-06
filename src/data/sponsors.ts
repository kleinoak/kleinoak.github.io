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

export type SponsorLogoSize = "feature" | "large" | "standard";

/**
 * How large a tier's logos are drawn: the top tier biggest, the second one
 * larger than the rest, everything below it uniform. A tier is a promise about
 * prominence, and this is the single place that promise is turned into pixels —
 * the sponsors page, the home page and the /admin preview all read it, so none
 * of them can quietly disagree about who is biggest.
 *
 * Keyed on the tier's position, not its name or `id`. Both of those are
 * editable from /admin, and renaming "Platinum Sponsor" — or letting the slug
 * regenerate as `platinum-sponsor` — would silently demote the business paying
 * the most, with nothing on screen to explain why. The order of
 * `content/sponsor-tiers.json` is already the order the tiers are published in,
 * so it is the one signal that cannot drift out of step with what a visitor sees.
 */
export function sponsorTierSize(position: number): SponsorLogoSize {
  if (position === 0) return "feature";
  if (position === 1) return "large";
  return "standard";
}
