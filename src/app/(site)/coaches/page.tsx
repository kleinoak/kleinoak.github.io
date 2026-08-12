import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { CoachCard } from "@/components/cards/CoachCard";
import { coaches } from "@/data/teams";
import { administration } from "@/data/administration";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Coaches" };

export default function CoachesPage() {
  return (
    <>
      <PageHero
        eyebrow="Leadership"
        title="Coaches"
        description="The coaching staff behind Klein Oak Panther Volleyball."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coaches.map((coach) => (
              <CoachCard key={coach.name} coach={coach} />
            ))}
          </div>

          <div className="mt-12 rounded-sm border border-border bg-surface p-8">
            <h2 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
              Coach biographies pending
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Biographies, photos, and staff contact details are not published yet. They will be
              added once the program confirms them.
            </p>
            <div className="mt-6">
              <a
                href={`mailto:${site.contactEmail}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-soft"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Contact the Program
              </a>
            </div>
          </div>

          {administration.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-primary sm:text-3xl">
                Program Administration
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {administration.map((person) => (
                  <CoachCard key={person.name} coach={person} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
