"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Archive, ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { AnnouncementCard } from "@/components/cards/AnnouncementCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { assetPath } from "@/lib/asset";
import {
  Announcement,
  AnnouncementSplit,
  splitAnnouncements,
} from "@/data/announcements";
import { programDate } from "@/data/calendar";

/** No external store to watch — only which side of hydration we are on. */
const subscribeToNothing = () => () => {};

/**
 * The Announcements section: current cards, a detail dialog behind each one,
 * and the archive of everything that has already happened.
 *
 * Three things shaped it.
 *
 * 1. **The split is re-checked in the browser**, exactly as
 *    `UpcomingEventsList` re-checks the upcoming feed and for the same reason:
 *    this is a static export, so the split baked into the HTML is only as fresh
 *    as the last build. A Spirit Night that ran last night would otherwise sit
 *    on the home page as news until the nightly rebuild. First render is the
 *    server's, so hydration matches and nothing flickers.
 *
 * 2. **The flyers are a dialog, not the page.** They are phone photographs of a
 *    screen — legible, but nothing like the quality of the rest of the site,
 *    and 200 KB each. The card carries the facts as real text and the poster
 *    stays one click away, so the home page neither looks like a noticeboard
 *    nor makes a phone download three posters to read three dates.
 *
 * 3. **The archive degrades to a `<details>`.** A modal cannot open without
 *    JavaScript, so before this mounts the archive is an ordinary disclosure
 *    holding the same list. That is the same bargain the gallery makes with its
 *    lightbox: the enhanced thing is better, the plain thing still works.
 */
export function AnnouncementsBrowser({
  announcements,
  initial,
}: {
  /** The whole feed, in content order. */
  announcements: Announcement[];
  /** The build-time split — what the server rendered. */
  initial: AnnouncementSplit;
}) {
  const [split, setSplit] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  // "Has this hydrated yet?", which is what decides whether the archive is a
  // dialog or a plain disclosure. `useSyncExternalStore` is the primitive for
  // exactly this: it returns the server snapshot during render and on the
  // hydration pass, then the client one — no effect, so no cascading render.
  const enhanced = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  useEffect(() => {
    const refresh = () => setSplit(splitAnnouncements(announcements, programDate()));

    refresh();

    // A page left open overnight would otherwise keep yesterday's split.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [announcements]);

  const { current, archived } = split;
  const open = useMemo(
    () => current.find((a) => a.id === openId) ?? null,
    [current, openId],
  );

  // `open` is derived rather than stored, which is what makes the midnight case
  // free: an announcement that archives itself while its dialog is open drops
  // out of `current`, `open` becomes null, and the dialog closes on its own.
  // A stale `openId` left behind is harmless — nothing renders from it.

  return (
    <>
      {current.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              enhanced={enhanced}
              onOpen={() => setOpenId(announcement.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="No announcements right now"
            description="Check back soon, or follow the program on social media for the latest updates."
          />
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-8 rounded-sm border border-border bg-surface p-5 sm:p-6">
          {enhanced ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Archive
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
                />
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-tight text-primary">
                    Archive
                  </h3>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {archived.length} earlier{" "}
                    {archived.length === 1 ? "announcement" : "announcements"} from this
                    season.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-accent-strong hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                View archive
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-3 font-display text-base font-semibold uppercase tracking-tight text-primary">
                <Archive aria-hidden="true" className="h-5 w-5 text-text-muted" />
                Archive
                <span className="font-sans text-sm font-normal normal-case tracking-normal text-text-muted">
                  {archived.length} earlier{" "}
                  {archived.length === 1 ? "announcement" : "announcements"}
                </span>
              </summary>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {archived.map((announcement) => (
                  <ArchiveRow key={announcement.id} announcement={announcement} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {open && (
        <Modal
          onClose={() => setOpenId(null)}
          title={open.title}
          description={[open.date, open.time].filter(Boolean).join(" · ")}
          size="lg"
        >
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              {open.location && (
                <p className="inline-flex items-start gap-2 text-sm text-text">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                  />
                  {open.location}
                </p>
              )}

              <p className="text-sm leading-relaxed text-text-muted">{open.summary}</p>

              {open.details && open.details.length > 0 && (
                <ul className="flex flex-col gap-2 rounded-sm bg-surface p-4 text-sm text-text">
                  {open.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
                      {detail}
                    </li>
                  ))}
                </ul>
              )}

              {open.actionHref && open.actionLabel && (
                <Link
                  href={open.actionHref}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
                >
                  {open.actionLabel}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
            </div>

            {open.flyer && (
              // A real <a> as well as an <img>: the dialog caps the poster to
              // the panel, and some of these carry small print and a QR code
              // that is only usable at full size.
              <a
                href={assetPath(open.flyer.src)}
                target="_blank"
                rel="noreferrer"
                className="block self-start overflow-hidden rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                <Image
                  src={assetPath(open.flyer.src)}
                  alt={open.flyer.alt}
                  width={open.flyer.width}
                  height={open.flyer.height}
                  sizes="(min-width: 640px) 24rem, 88vw"
                  className="h-auto w-full"
                />
              </a>
            )}
          </div>
        </Modal>
      )}

      {archiveOpen && (
        <Modal
          onClose={() => setArchiveOpen(false)}
          title="Announcement archive"
          description={`${archived.length} earlier ${
            archived.length === 1 ? "announcement" : "announcements"
          } from this season.`}
        >
          <ul className="divide-y divide-border">
            {archived.map((announcement) => (
              <ArchiveRow key={announcement.id} announcement={announcement} />
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}

/**
 * One archived announcement. Flat markup on purpose — the archive is a list to
 * read, and opening a second dialog from inside the first is the kind of thing
 * that traps a keyboard user.
 */
function ArchiveRow({ announcement }: { announcement: Announcement }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span className="inline-flex items-center gap-2">
          <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
          <time>{announcement.date}</time>
        </span>
        {announcement.time && (
          <span className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {announcement.time}
          </span>
        )}
      </div>
      <h3 className="mt-1 font-display text-base font-semibold uppercase tracking-tight text-primary">
        {announcement.title}
      </h3>
      <p className="mt-1 text-sm text-text-muted">{announcement.summary}</p>
      {announcement.actionHref && announcement.actionLabel && (
        <Link
          href={announcement.actionHref}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
        >
          {announcement.actionLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </li>
  );
}
