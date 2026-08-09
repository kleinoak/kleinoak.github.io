import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EventCard } from "@/components/cards/EventCard";
import { programEvents } from "@/data/events";

export function UpcomingEvents() {
  const upcoming = programEvents.slice(0, 4);

  return (
    <section aria-labelledby="events-heading" className="bg-surface py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div id="events-heading">
            <SectionHeading eyebrow="Mark Your Calendar" title="Upcoming Events" />
          </div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
          >
            Full schedule
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </Container>
    </section>
  );
}
