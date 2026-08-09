import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { camps, tryoutMilestones, tryouts } from "@/data/camps";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Camps & Tryouts" };

export default function CampsTryoutsPage() {
  return (
    <>
      <PageHero
        eyebrow="2026 Season"
        title="Camps & Tryouts"
        description="Every path into Panther Volleyball, from youth camps to varsity tryouts."
      >
        <div className="mt-6">
          <Button href={site.campBrochureUrl} variant="primary" external>
            Register via Rank One
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </PageHero>

      <section aria-labelledby="camps-heading" className="py-16 sm:py-20">
        <Container>
          <div id="camps-heading">
            <SectionHeading eyebrow="Registration Open" title="Camp Opportunities" />
          </div>
          <div className="mt-10 overflow-x-auto rounded-sm border border-border">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">2026 Klein Oak Volleyball camp schedule and pricing</caption>
              <thead>
                <tr className="bg-primary text-white">
                  <th scope="col" className="px-5 py-3 font-semibold uppercase tracking-wide">
                    Camp
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold uppercase tracking-wide">
                    Audience
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold uppercase tracking-wide">
                    Dates
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold uppercase tracking-wide">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {camps.map((camp) => (
                  <tr key={camp.id}>
                    <td className="px-5 py-4 font-semibold text-primary">{camp.name}</td>
                    <td className="px-5 py-4 text-text-muted">{camp.audience}</td>
                    <td className="px-5 py-4 text-text-muted">{camp.dates}</td>
                    <td className="px-5 py-4 font-display font-bold text-accent-strong">
                      {camp.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Full requirements and registration are handled through Klein ISD&apos;s official camp
            store —{" "}
            <a
              href={site.campBrochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-strong hover:underline"
            >
              open the camp brochure
            </a>
            .
          </p>
        </Container>
      </section>

      <section aria-labelledby="tryouts-heading" className="bg-primary py-16 text-white sm:py-20">
        <Container>
          <div id="tryouts-heading">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-accent">
              Requirements
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Tryout Dates
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {tryouts.map((tryout) => (
              <div key={tryout.group} className="rounded-sm border border-white/15 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  {tryout.group}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-accent">{tryout.dates}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {tryoutMilestones.map((milestone) => (
              <li
                key={milestone.label}
                className="flex-1 rounded-sm border border-white/15 bg-white/5 px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  {milestone.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{milestone.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
