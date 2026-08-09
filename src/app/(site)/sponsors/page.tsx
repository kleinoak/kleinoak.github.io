import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SponsorLogoCard } from "@/components/cards/SponsorLogoCard";
import { Badge } from "@/components/ui/Badge";
import { sponsorSteps, sponsorTiers } from "@/data/sponsors";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Sponsors" };

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Community Support"
        title="Sponsors"
        description="Klein Oak Volleyball is booster-run and community-supported. Thank you to every sponsor that makes the program possible."
      />

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-14">
          {sponsorTiers.map((tier) => (
            <div key={tier.id}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-primary">
                  {tier.name}
                </h2>
                <Badge tone="gold">{tier.price}</Badge>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {tier.sponsors.map((name) => (
                  <SponsorLogoCard key={name} name={name} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-text-muted">
            This is a partial sponsor list gathered from the current live site — some sponsor
            logos there carry no legible name and are intentionally omitted rather than guessed.
            The Booster Club should confirm the complete, current sponsor roster before this
            content is published anywhere official.
          </p>
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
