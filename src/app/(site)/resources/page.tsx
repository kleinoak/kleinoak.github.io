import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { resources } from "@/data/resources";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="For Parents & Players"
        title="Resources"
        description="Portals, registration links, and program contacts in one place."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
