"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, GraduationCap, MapPin, ShoppingBasket, Utensils } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { programDate } from "@/data/calendar";
import {
  SpiritEvent,
  SpiritMonth,
  SpiritTone,
  groupByMonth,
  spiritTitle,
  upcomingSpiritEvents,
} from "@/data/spiritEvents";

/**
 * "Upcoming Events at a Glance" — the spirit calendar.
 *
 * The theme is the whole point of this section, so the theme drives the design
 * rather than sitting in it as a word. Each card carries a rule in the colour
 * being called for, and the chip repeats it with a swatch, so a parent scanning
 * for "which night do I wear gold" can answer it without reading a line of copy.
 *
 * **The program's list uses emoji; this does not.** The site's visual language
 * is lucide icons and the black/gold palette, and a wall of 🏆💛🖤🤠 next to
 * that reads as a different website pasted in. The information the emoji carried
 * — theme colour, what kind of night it is — is in the swatch and the icon
 * instead, which also means a screen reader gets "Gold Out" rather than "trophy
 * yellow heart". The copy itself is verbatim, exclamation marks and all: that
 * energy is the program's voice and not mine to flatten.
 *
 * Dates filter themselves out, re-checked in the browser like every other dated
 * list here — a static export's idea of "upcoming" is otherwise as old as its
 * last build.
 */

const TONES: Record<SpiritTone, { rule: string; swatch: string; chip: string }> = {
  gold: {
    rule: "bg-accent",
    swatch: "bg-accent border-accent",
    chip: "bg-accent/15 text-accent-strong",
  },
  black: {
    rule: "bg-primary",
    swatch: "bg-primary border-primary",
    chip: "bg-primary/10 text-primary",
  },
  // A white swatch needs a border or it disappears into the card.
  white: {
    rule: "bg-border",
    swatch: "bg-white border-border",
    chip: "bg-black/5 text-text",
  },
};

const KIND_ICON = {
  "spirit-night": Utensils,
  drive: ShoppingBasket,
} as const;

function ThemeChip({ label, tone }: { label: string; tone: SpiritTone }) {
  const styles = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${styles.chip}`}
    >
      <span
        aria-hidden="true"
        className={`h-3 w-3 rounded-full border ${styles.swatch}`}
      />
      {label}
    </span>
  );
}

function HomeAwayChip({ homeAway }: { homeAway: "home" | "away" }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        homeAway === "home" ? "bg-accent/15 text-accent-strong" : "bg-black/5 text-text-muted"
      }`}
    >
      {homeAway}
    </span>
  );
}

/** Exported so /admin can preview the real card rather than a copy of it. */
export function SpiritEventCard({ event }: { event: SpiritEvent }) {
  const tone = event.themeTone;
  // Only a themed night gets a coloured rule. An earlier version gave the
  // unthemed cards `bg-border` too, which made a White Hot night and an away
  // night look identical along the top — and telling those apart at a glance is
  // the entire reason the rule exists. Unthemed is now blank.
  const rule = tone ? TONES[tone].rule : "bg-transparent";
  const Icon = event.kind === "game" ? null : KIND_ICON[event.kind];
  const isFixture = event.kind === "game";

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-border bg-background">
      {/* The colour being asked for, as a rule across the top. Away nights and
          non-fixtures have no theme, so the band is left blank rather than
          given a colour nobody called for — and the reserved height keeps every
          card in a row starting at the same line. */}
      <div aria-hidden="true" className={`h-1.5 w-full ${rule}`} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <time
            dateTime={event.startDate}
            className="font-display text-sm font-bold uppercase tracking-wide text-primary"
          >
            {event.date}
          </time>
          {isFixture && event.homeAway && <HomeAwayChip homeAway={event.homeAway} />}
          {!isFixture && (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-strong">
              {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
              {event.kind === "drive" ? "Donation drive" : "Spirit night"}
            </span>
          )}
        </div>

        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-primary">
          {spiritTitle(event)}
        </h3>

        {(event.themeLabel && tone) || event.occasion ? (
          <div className="flex flex-wrap items-center gap-2">
            {event.themeLabel && tone && <ThemeChip label={event.themeLabel} tone={tone} />}
            {event.occasion && (
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-black/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
                {event.occasion}
              </span>
            )}
          </div>
        ) : null}

        {event.rally && (
          <p className="font-display text-base font-semibold uppercase tracking-tight text-accent-strong">
            {event.rally}
          </p>
        )}

        {(event.location || event.time) && (
          <ul className="flex flex-col gap-1 text-sm text-text-muted">
            {event.location && (
              <li className="flex items-start gap-2">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {event.location}
              </li>
            )}
            {event.time && (
              <li className="flex items-start gap-2">
                <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {event.time}
              </li>
            )}
          </ul>
        )}

        {/* Deliberately not `mt-auto`. Pushing this to the bottom of a
            stretched grid cell left a hole in the middle of every short card;
            uneven whitespace below is better than a paragraph adrift. */}
        <p className="text-sm leading-relaxed text-text-muted">{event.detail}</p>
      </div>
    </article>
  );
}

export function SpiritCalendar({
  events,
  initial,
}: {
  events: SpiritEvent[];
  /** The build-time grouping — what the server rendered. */
  initial: SpiritMonth[];
}) {
  const [months, setMonths] = useState(initial);

  useEffect(() => {
    const refresh = () =>
      setMonths(groupByMonth(upcomingSpiritEvents(events, programDate())));

    refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [events]);

  // The season ends. When the last date passes this becomes an empty section,
  // and an empty section with a heading shouting "Upcoming Events" is worse
  // than no section, so it removes itself.
  if (months.length === 0) return null;

  return (
    <section aria-labelledby="spirit-calendar-heading" className="bg-surface py-16 sm:py-20">
      <Container>
        <div id="spirit-calendar-heading">
          <SectionHeading
            eyebrow="Panther Pride"
            title="Upcoming Events at a Glance"
            description="Pack the stands, show your Panther Pride, and support Klein Oak Volleyball."
          />
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {months.map((month) => (
            <div key={month.key}>
              <h3 className="flex items-center gap-4 font-display text-xl font-bold uppercase tracking-tight text-primary">
                {month.label}
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
                <span className="text-sm font-normal normal-case tracking-normal text-text-muted">
                  {month.events.length} {month.events.length === 1 ? "date" : "dates"}
                </span>
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {month.events.map((event) => (
                  <SpiritEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-text-muted">
          Start times for every level are on the{" "}
          <Link
            href="/schedule"
            className="font-semibold text-accent-strong hover:underline"
          >
            full schedule
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
