import { Coach } from "@/data/teams";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <article className="rounded-sm border border-border bg-background p-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-accent"
      >
        {initials(coach.name)}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-tight text-primary">
        {coach.name}
      </h3>
      <p className="text-sm text-text-muted">{coach.title}</p>
      {!coach.bioAvailable && (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-muted/70">
          Bio coming soon
        </p>
      )}
    </article>
  );
}
