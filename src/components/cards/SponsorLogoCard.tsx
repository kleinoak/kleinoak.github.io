import Image from "next/image";
import { SponsorLogoSize, sponsorLogoFor } from "@/data/sponsors";
import { assetPath } from "@/lib/asset";

/**
 * One sponsor's plate.
 *
 * Three sizes, because a sponsorship tier is a promise about prominence and the
 * page has to keep it. The logo caps step 192px, 128px and 96px tall at `sm` and
 * up — a difference nobody has to be told about: the platinum mark stands twice
 * the height of a black-tier one on the same screen. Which tier gets which size
 * is decided by `sponsorTierSize`, never here.
 *
 * The caps bind on height for an upright mark and on width for a long wordmark,
 * so two logos in the same row are the same *size* without being the same
 * height — which is the only thing that can be promised when one sponsor sends a
 * square badge and the next sends a 4:1 wordmark.
 *
 * **The plate is white at every size.** Tinting it to signal the tier is the
 * obvious idea and the wrong one: sponsors send whatever artwork they have, a
 * white field is what a mark is almost always drawn against, and the first
 * business to send a dark-background file would find its logo unreadable. The
 * tier reads through size and framing instead — a gold border and a lift on the
 * top tier, a faint gold border on the second, the ordinary card border below.
 *
 * The height is fixed per size rather than derived from the artwork, so a row of
 * sponsors lines up regardless of whether a mark is a wide wordmark or a square
 * badge, and `object-contain` scales each one inside that box without cropping
 * anybody's logo.
 */
const SIZES: Record<
  SponsorLogoSize,
  { plate: string; logo: string; fallback: string }
> = {
  feature: {
    plate:
      "h-48 px-6 sm:h-64 sm:px-12 border-accent shadow-[0_2px_28px_rgba(13,13,13,0.10)]",
    logo: "max-h-32 sm:max-h-48",
    fallback: "text-2xl sm:text-4xl",
  },
  large: {
    plate: "h-40 px-5 sm:h-48 sm:px-10 border-accent/45",
    logo: "max-h-24 sm:max-h-32",
    fallback: "text-xl sm:text-3xl",
  },
  standard: {
    plate: "h-28 px-4 sm:h-32 border-border",
    // 80/96 rather than 64/80: the cap binds on height for an upright mark, so
    // the tallest artwork in this tier was rendering at barely half the plate's
    // usable width while the wide wordmarks beside it filled every pixel of it.
    // 96 is what a 128px plate takes with 16px of air above and below.
    logo: "max-h-20 sm:max-h-24",
    fallback: "text-base sm:text-lg",
  },
};

export function SponsorLogoCard({
  name,
  size = "standard",
}: {
  name: string;
  size?: SponsorLogoSize;
}) {
  const entry = sponsorLogoFor(name);
  const styles = SIZES[size];

  const plate = `flex w-full items-center justify-center rounded-sm border bg-white text-center transition-colors hover:border-accent-strong ${styles.plate}`;

  const artwork = entry ? (
    <Image
      src={assetPath(entry.logo.src)}
      alt={entry.logo.alt}
      width={entry.logo.width}
      height={entry.logo.height}
      // The lift only exists when an ancestor carries `group`, which only the
      // linked version does — so an unlinked plate stays completely still and
      // never suggests it can be clicked.
      className={`w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03] ${styles.logo}`}
    />
  ) : (
    // No artwork on file — the business name is the fallback, so a sponsor
    // can be listed the moment they sign up. It scales with the tier too:
    // a platinum sponsor whose logo has not arrived yet still gets the
    // prominence they paid for.
    <span
      className={`font-display font-semibold uppercase tracking-tight text-primary ${styles.fallback}`}
    >
      {name}
    </span>
  );

  // A sponsor with no `url` is a plain plate, not a dead link: businesses
  // without a website, or that have not asked to be linked, are normal.
  if (!entry?.url) {
    return <div className={plate}>{artwork}</div>;
  }

  return (
    <a
      href={entry.url}
      target="_blank"
      // noopener/noreferrer: without it the opened tab gets a handle on this
      // one via window.opener and could navigate it elsewhere. These are other
      // people's sites, which is exactly when that matters.
      rel="noopener noreferrer"
      className={`group ${plate}`}
    >
      {artwork}
      {/* The link's accessible name is the alt text plus this, so it reads
          "Blue Louis Boutique logo (opens in a new tab)" — the same phrasing
          the sponsorship-form link on this page already uses. `sr-only` is
          absolutely positioned, so it adds no flex item to the plate. */}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
