import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Team } from "@/data/teams";

export function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group flex flex-col justify-between gap-6 rounded-sm border border-border bg-primary p-8 text-white transition-colors hover:bg-primary-soft"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          {team.level}
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
          {team.name}
        </h3>
        <p className="mt-3 text-sm text-white/70">{team.description}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
        View Team
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
