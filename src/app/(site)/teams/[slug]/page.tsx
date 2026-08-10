import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { assetPath } from "@/lib/asset";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { teams } from "@/data/teams";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return teams.map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const team = teams.find((t) => t.slug === slug);
  return { title: team ? `${team.name} Volleyball` : "Team" };
}

export default async function TeamDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const team = teams.find((t) => t.slug === slug);
  if (!team) notFound();

  const otherTeams = teams.filter((t) => t.slug !== team.slug);

  return (
    <>
      <PageHero eyebrow={team.level} title={`${team.name} Volleyball`} description={team.description} />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {team.photo && (
              <figure className="mb-10">
                <Image
                  src={assetPath(team.photo.src)}
                  alt={team.photo.alt}
                  width={team.photo.width}
                  height={team.photo.height}
                  priority
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="h-auto w-full rounded-sm border border-border"
                />
                <figcaption className="mt-3 text-sm text-text-muted">
                  {team.name} team photo.
                </figcaption>
              </figure>
            )}

            {team.roster && team.roster.length > 0 ? (
              <section aria-labelledby="roster-heading">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="roster-heading"
                    className="font-display text-2xl font-bold uppercase tracking-tight text-primary"
                  >
                    2026 Roster
                  </h2>
                  <p className="text-sm text-text-muted">
                    {team.roster.length} players
                  </p>
                </div>
                <ol className="mt-6 grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                  {team.roster.map((player) => (
                    <li
                      key={player}
                      className="border-b border-border py-3 text-base text-primary"
                    >
                      {player}
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm text-text-muted">
                  Roster as published by the program. Jersey numbers and player photos are not
                  published.
                </p>
              </section>
            ) : (
              <EmptyState
                title="Roster coming soon"
                description="This level's roster has not been published yet. It will appear here once the program posts it."
              />
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/schedule" variant="secondary">
                View Schedule
              </Button>
              <Button href="/coaches" variant="ghost">
                Meet the Coaches
              </Button>
            </div>
          </div>

          <aside aria-label="Other teams" className="rounded-sm border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Other Levels
            </h2>
            <ul className="mt-4 space-y-3">
              {otherTeams.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/teams/${other.slug}`}
                    className="flex items-center justify-between rounded-sm border border-border bg-background px-4 py-3 text-sm font-semibold text-primary hover:border-accent-strong"
                  >
                    {other.name}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>
    </>
  );
}
