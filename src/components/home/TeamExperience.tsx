import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TeamCard } from "@/components/cards/TeamCard";
import { teams } from "@/data/teams";

export function TeamExperience() {
  return (
    <section aria-labelledby="teams-heading" className="py-16 sm:py-20">
      <Container>
        <div id="teams-heading">
          <SectionHeading
            eyebrow="Panther Volleyball"
            title="The Team Experience"
            description="Three levels, one program — every Panther volleyball athlete builds toward the same standard of competition and character."
          />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => (
            <TeamCard key={team.slug} team={team} />
          ))}
        </div>
      </Container>
    </section>
  );
}
