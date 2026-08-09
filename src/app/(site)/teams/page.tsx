import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TeamCard } from "@/components/cards/TeamCard";
import { Button } from "@/components/ui/Button";
import { teams } from "@/data/teams";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <>
      <PageHero
        eyebrow="Panther Volleyball"
        title="Teams"
        description="Varsity, Junior Varsity, Flex, and Freshman — every level builds toward the same program standard."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <TeamCard key={team.slug} team={team} />
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="coaches-heading" className="bg-surface py-16 sm:py-20">
        <Container>
          <div id="coaches-heading">
            <SectionHeading
              eyebrow="Leadership"
              title="Program Coaches"
              description="Meet the coaching staff behind every level of Panther Volleyball."
            />
          </div>
          <div className="mt-8">
            <Button href="/coaches" variant="secondary">
              View Coaches
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
