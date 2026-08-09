import { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border-dark bg-primary text-white">
      <Container className="py-14 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">{description}</p>}
        {children}
      </Container>
    </section>
  );
}
