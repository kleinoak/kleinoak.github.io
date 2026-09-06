import type { Metadata } from "next";
import { FileText, Mail } from "lucide-react";
import { assetPath } from "@/lib/asset";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SponsorLogoCard } from "@/components/cards/SponsorLogoCard";
import { Badge } from "@/components/ui/Badge";
import {
  SponsorLogoSize,
  sponsorSteps,
  sponsorTierSize,
  sponsorTiers,
} from "@/data/sponsors";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Sponsors" };

/**
 * How each tier's row is laid out, per logo size: `row` sizes and centres the
 * row itself, `item` sets how many plates fit across it, and `rule` is the
 * hairline between the tier's name and its price.
 *
 * Rows are flex-wrapped rather than gridded, because a grid leaves a short last
 * row hard against the left edge — four black sponsors in a three-column grid
 * put the fourth business alone in the bottom-left corner, which reads as a
 * layout that broke rather than a wall of supporters. Flex with `justify-center`
 * centres whatever is left over, at any number of sponsors.
 *
 * The top tier spans the container; the second is held to two columns of a
 * `max-w-3xl` row, so even with one business in each the step down is a step in
 * both dimensions and the plate stays close-fitting around the mark instead of
 * stranding it in the middle of a wide empty box. The widths are expressed as
 * `calc(<share> - <share of the 1rem gap>)` so the columns add up exactly.
 */
const TIER_LAYOUT: Record<SponsorLogoSize, { row: string; item: string; rule: string }> = {
  feature: { row: "", item: "w-full", rule: "bg-accent/60" },
  large: {
    row: "mx-auto w-full max-w-3xl",
    item: "w-full sm:w-[calc(50%-0.5rem)]",
    rule: "bg-accent/30",
  },
  standard: {
    row: "",
    item:
      "w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]",
    rule: "bg-border",
  },
};

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Community Support - Booster Club"
        title="2026 Sponsors"
        description="Klein Oak Volleyball is booster-run and community-supported. Thank you to every sponsor that makes the program possible."
      />

      {/* The wall. Tiers run top to bottom in the order they are published in,
          and the logos shrink as they go: a visitor who never reads a tier name
          still sees who backs the program hardest, which is the whole of what a
          business buys with a platinum sponsorship. */}
      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-14 sm:gap-16">
          {sponsorTiers.map((tier, position) => {
            const size = sponsorTierSize(position);
            const layout = TIER_LAYOUT[size];

            return (
              <section key={tier.id} aria-labelledby={`tier-${tier.id}`}>
                {/* Name, rule, price — the same header shape the spirit
                    calendar uses for its months, so the page reads as part of
                    this site rather than a separate one. The rule warms towards
                    gold as the tier goes up. */}
                <h2
                  id={`tier-${tier.id}`}
                  className="flex items-center gap-4 font-display text-xl font-bold uppercase tracking-tight text-primary sm:text-2xl"
                >
                  {tier.name}
                  <span aria-hidden="true" className={`h-px flex-1 ${layout.rule}`} />
                  <Badge tone="gold">{tier.price}</Badge>
                </h2>

                <div
                  className={`mt-6 flex flex-wrap justify-center gap-4 ${layout.row}`}
                >
                  {tier.sponsors.map((name) => (
                    <div key={name} className={layout.item}>
                      <SponsorLogoCard name={name} size={size} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </Container>
      </section>

      <section aria-labelledby="become-sponsor-heading" className="bg-primary py-16 text-white sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div id="become-sponsor-heading">
            <SectionHeading eyebrow="Get Involved" title="Become a Sponsor" />
            <ol className="mt-8 flex flex-col gap-4">
              {sponsorSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm text-white/80 sm:text-base">{step}</p>
                </li>
              ))}
            </ol>
            <a
              href={assetPath(site.sponsorFormUrl)}
              target="_blank"
              // noopener/noreferrer: without it the opened tab gets a handle on
              // this one via window.opener and could navigate it elsewhere.
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-sm border border-white/25 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:border-accent hover:bg-accent hover:text-primary"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              Download the Sponsorship Form
              <span className="font-normal normal-case tracking-normal text-white/60">
                (PDF, opens in a new tab)
              </span>
            </a>
          </div>

          <div className="rounded-sm border border-white/15 bg-white/5 p-8">
            <h3 className="font-display text-lg font-semibold uppercase tracking-tight">
              Sponsorship Levels
            </h3>
            <ul className="mt-4 space-y-3">
              {sponsorTiers.map((tier) => (
                <li
                  key={tier.id}
                  className="flex items-center justify-between rounded-sm border border-white/15 px-4 py-3 text-sm font-semibold"
                >
                  {tier.name}
                  <span className="text-accent">{tier.price}</span>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-accent-strong hover:text-white"
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              Email the Booster Club
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
