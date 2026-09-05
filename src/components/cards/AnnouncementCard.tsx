import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, Maximize2 } from "lucide-react";
import { Announcement } from "@/data/announcements";
import { assetPath } from "@/lib/asset";

/**
 * One announcement.
 *
 * `onOpen` is optional on purpose. The home page passes it and the card
 * becomes a way into the detail dialog; the /admin preview and any non-
 * interactive caller pass nothing and get a plain card that still says
 * everything the content holds. Nothing here is client-only, so it stays a
 * server component and the interactive wrapper is the thing marked "use
 * client".
 *
 * Two rules keep it honest with JavaScript off:
 *
 * - **The flyer is a real `<a>` to the poster**, and `onOpen` only intercepts
 *   the click. That is the gallery's bargain: with scripting the dialog opens,
 *   without it the browser shows the image, and either way the control does
 *   something. Modified clicks (new tab, save) are left alone.
 * - **"Details" only renders once the page has hydrated**, because unlike the
 *   flyer it has no non-JS equivalent — a button that silently does nothing is
 *   worse than no button. It is also skipped when the dialog would only repeat
 *   the card back.
 */
export function AnnouncementCard({
  announcement,
  onOpen,
  enhanced = false,
}: {
  announcement: Announcement;
  onOpen?: () => void;
  /** True once the client has hydrated and a dialog can actually open. */
  enhanced?: boolean;
}) {
  const { flyer } = announcement;
  const thumbSrc = flyer?.thumb ?? flyer?.src;
  const hasMoreToShow = Boolean(flyer || announcement.details?.length);

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-border bg-background">
      {flyer && thumbSrc && (
        // The flyer is cropped to a strip rather than shown whole: these are
        // tall posters, and a card that renders one at full aspect ratio is
        // mostly poster. The crop is centred rather than top-aligned because
        // the two Spirit Night posters share a headline — cropped to the top
        // they are the same picture twice, and the middle band is where the
        // restaurant actually appears.
        <div className="relative border-b border-border bg-primary">
          {onOpen ? (
            <a
              href={assetPath(flyer.src)}
              onClick={(event) => {
                // Let modified clicks (new tab, save) behave normally.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpen();
              }}
              className="group block w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              aria-label={`Open ${announcement.title} — full flyer and details`}
            >
              <Image
                src={assetPath(thumbSrc)}
                alt=""
                width={flyer.thumbWidth ?? flyer.width}
                height={flyer.thumbHeight ?? flyer.height}
                loading="lazy"
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                className="h-44 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-black/70 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
                View flyer
              </span>
            </a>
          ) : (
            <Image
              src={assetPath(thumbSrc)}
              alt={flyer.alt}
              width={flyer.thumbWidth ?? flyer.width}
              height={flyer.thumbHeight ?? flyer.height}
              loading="lazy"
              className="h-44 w-full object-cover object-center"
            />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          <span className="inline-flex items-center gap-2">
            <Calendar aria-hidden="true" className="h-4 w-4" />
            <time>{announcement.date}</time>
          </span>
          {announcement.time && (
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {announcement.time}
            </span>
          )}
        </div>

        <h3 className="font-display text-xl font-semibold uppercase tracking-tight text-primary">
          {announcement.title}
        </h3>

        {announcement.location && (
          <p className="inline-flex items-start gap-2 text-sm text-text-muted">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {announcement.location}
          </p>
        )}

        <p className="text-sm text-text-muted">{announcement.summary}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          {onOpen && enhanced && hasMoreToShow && (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
            >
              Details
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
          {announcement.actionHref && announcement.actionLabel && (
            <Link
              href={announcement.actionHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
            >
              {announcement.actionLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
