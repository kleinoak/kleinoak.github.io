import { Clock, MapPin } from "lucide-react";
import { CalendarEntry } from "@/data/calendar";
import { Badge } from "@/components/ui/Badge";

export function EventCard({ event }: { event: CalendarEntry }) {
  return (
    <article className="flex gap-4 rounded-sm border border-border bg-background p-5">
      <div className="flex w-16 flex-none flex-col items-center justify-center rounded-sm bg-primary text-white">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
          2026
        </span>
        <span className="font-display text-sm font-bold leading-tight uppercase text-center px-1">
          {event.date}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-semibold uppercase tracking-tight text-primary">
            {event.title}
          </h3>
          <Badge tone={event.status === "confirmed" ? "success" : "warning"}>
            {event.status === "confirmed" ? "Confirmed" : "Tentative"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
          {event.time && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              {event.time}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
        {event.levelTimes && (
          <dl className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {event.levelTimes.map((level) => (
              <div key={level.label} className="inline-flex items-center gap-1.5">
                <dt className="font-semibold uppercase tracking-wide text-[0.7rem] text-accent-strong">
                  {level.label}
                </dt>
                <dd className="text-text-muted">{level.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
