import Image from "next/image";
import { Coach } from "@/data/teams";
import { assetPath } from "@/lib/asset";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

/**
 * One coach, at the length a real bio needs.
 *
 * A row rather than a card in a four-across grid, which is what this page used
 * while there was nothing to say: the bios run 55 to 95 words and vary by
 * nearly half, and equal-height cards either clip the longest or leave the
 * shortest floating in space. A row lets each one be its own length.
 *
 * **The portrait is already a circle.** These were lifted out of the program's
 * "Meet The Coaches" deck, where every photo is circular, and the mask is baked
 * into the WebP's alpha channel rather than applied with `rounded-full` here.
 * Two reasons: the shapes are then identical to the ones the coaches approved,
 * and nothing depends on the CSS to hide the corners of an image that would
 * otherwise carry a slide's yellow background.
 *
 * A coach with no photo keeps the initials monogram, so the row degrades to
 * something deliberate rather than a gap.
 */
export function CoachProfile({ coach }: { coach: Coach }) {
  const showBio = coach.bioAvailable && Boolean(coach.bio);

  return (
    <article className="flex flex-col items-center gap-6 rounded-sm border border-border bg-background p-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:p-8 sm:text-left">
      <div className="shrink-0">
        {coach.photo ? (
          <Image
            src={assetPath(coach.photo.src)}
            alt={coach.photo.alt}
            width={coach.photo.width}
            height={coach.photo.height}
            sizes="(min-width: 640px) 11rem, 9rem"
            className="h-36 w-36 object-cover sm:h-44 sm:w-44"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-36 w-36 items-center justify-center rounded-full bg-primary font-display text-3xl font-bold text-accent sm:h-44 sm:w-44"
          >
            {initials(coach.name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-primary sm:text-2xl">
          {coach.name}
        </h3>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-accent-strong">
          {coach.title}
        </p>
        {showBio ? (
          // Left-aligned even on the phone, where the rest of the card is
          // centred: a centred paragraph running six or seven lines is ragged
          // on both edges and measurably harder to read than a centred name.
          <p className="mt-4 max-w-prose text-left text-sm leading-relaxed text-text-muted">
            {coach.bio}
          </p>
        ) : (
          <p className="mt-4 text-sm text-text-muted/70">Bio coming soon.</p>
        )}
      </div>
    </article>
  );
}
