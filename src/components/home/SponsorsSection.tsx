import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SponsorLogoCard } from "@/components/cards/SponsorLogoCard";
import { sponsorTierSize, sponsorTiers } from "@/data/sponsors";

/**
 * The home page's thank-you wall.
 *
 * The top tier gets the same feature plate it has on the sponsors page — the
 * prominence is the product, and it would be an odd promise that only held on
 * the page nobody lands on first. Every other sponsor follows in one uniform
 * strip: the tier names, prices and the full step-down live on /sponsors, and
 * repeating all of that here would just be the sponsors page twice.
 *
 * This used to render `sponsorTiers.find(t => t.id === "platinum")` into a
 * four-column grid. That was fine while three businesses sat in that tier and
 * looked like a loading failure the season one did.
 */
export function SponsorsSection() {
  const [top, ...rest] = sponsorTiers;
  const others = rest.flatMap((tier) => tier.sponsors);

  if (!top) return null;

  return (
    <section aria-labelledby="sponsors-heading" className="bg-surface py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div id="sponsors-heading">
            <SectionHeading eyebrow="Community Support" title="Our Sponsors" />
          </div>
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
          >
            All sponsors &amp; tiers
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4">
          {top.sponsors.map((name) => (
            <SponsorLogoCard key={name} name={name} size={sponsorTierSize(0)} />
          ))}
        </div>

        {/* Flex-wrapped and centred, not a grid, for the same reason the
            sponsors page is: an odd number of sponsors leaves the last one
            alone against the left edge of a grid, which looks like a row that
            failed rather than a wall of supporters. */}
        {others.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {others.map((name) => (
              <div
                key={name}
                className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]"
              >
                <SponsorLogoCard name={name} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
