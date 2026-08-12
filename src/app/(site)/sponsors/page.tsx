import type { Metadata } from "next";
import { FileText, Mail } from "lucide-react";
import { assetPath } from "@/lib/asset";
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
        eyebrow="Community Support - Booster Club"
        title="2025 Sponsors"
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
