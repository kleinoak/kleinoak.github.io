import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SponsorLogoCard } from "@/components/cards/SponsorLogoCard";
import { sponsorTiers } from "@/data/sponsors";

export function SponsorsSection() {
  const platinum = sponsorTiers.find((tier) => tier.id === "platinum");

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
        {platinum && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {platinum.sponsors.map((name) => (
              <SponsorLogoCard key={name} name={name} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
