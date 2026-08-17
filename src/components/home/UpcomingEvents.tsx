import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UpcomingEventsList } from "@/components/home/UpcomingEventsList";
import { upcomingCalendar } from "@/data/calendar";

const SHOWN = 4;

export function UpcomingEvents() {
  // Everything still ahead at build time is handed to the client so it can
  // re-filter against the real date; the first `SHOWN` of those are what the
  // server renders, and what a reader without JavaScript keeps.
  const upcoming = upcomingCalendar();

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
        <UpcomingEventsList
          entries={upcoming}
          initial={upcoming.slice(0, SHOWN)}
          limit={SHOWN}
        />
      </Container>
    </section>
  );
}
