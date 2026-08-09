import { Flame, Handshake, TrendingUp, Trophy } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const pillars = [
  {
    title: "Teamwork",
    description: "Every point is won together — on the court and in the program.",
    Icon: Handshake,
  },
  {
    title: "Growth",
    description: "From first camp to senior night, athletes are developed at every level.",
    Icon: TrendingUp,
  },
  {
    title: "Competition",
    description: "Preparation and discipline built for district and postseason play.",
    Icon: Trophy,
  },
  {
    title: "Panther Pride",
    description: "Representing Klein Oak High School with commitment and character.",
    Icon: Flame,
  },
];

export function Culture() {
  return (
    <section aria-labelledby="culture-heading" className="py-16 sm:py-20">
      <Container>
        <div id="culture-heading">
          <SectionHeading eyebrow="What We Stand For" title="Panther Volleyball Culture" align="center" />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-sm border border-border bg-surface p-6 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-accent">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
                {title}
              </h3>
              <p className="text-sm text-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
