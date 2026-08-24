"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { assetPath } from "@/lib/asset";
import type { Album } from "@/data/gallery";
import { photoAlt } from "@/data/gallery";

/**
 * Album filter + photo grid + lightbox.
 *
 * Three things drove the shape of this:
 *
 * 1. **It has to work without JavaScript.** Every thumbnail is a real `<a>` to
 *    the full-size image, so with scripting off the grid is still a browsable
 *    gallery — you just get the browser's own image view instead of the
 *    lightbox. The filter is `<input type="radio">` in a `<fieldset>`, matching
 *    `ScheduleBrowser`; with JS off every album is shown, which is the useful
 *    fallback rather than an empty page.
 *
 * 2. **A gallery this size cannot all load at once.** Thumbnails are ~600px WebP and
 *    lazy-loaded, so the browser fetches what is on screen. The full-size image
 *    is only ever requested when a lightbox opens.
 *
 * 3. **A lightbox is a dialog, and dialogs have rules.** Focus moves in and is
 *    trapped, Escape closes, arrows move between photos, the page behind does
 *    not scroll, and focus returns to the thumbnail that opened it. Skipping
 *    any of those makes it unusable by keyboard.
 */
export function GalleryBrowser({ albums }: { albums: Album[] }) {
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const shown = useMemo(
    () => (activeSlug === "all" ? albums : albums.filter((a) => a.slug === activeSlug)),
    [albums, activeSlug],
  );

  // One flat list of what is currently visible: the lightbox steps through the
  // filtered set, not the whole library, so "next" means what the eye expects.
  const sequence = useMemo(
    () =>
      shown.flatMap((album) =>
        album.photos.map((photo, index) => ({
          photo,
          album,
          indexInAlbum: index,
          albumTotal: album.photos.length,
        })),
      ),
    [shown],
  );

  const total = sequence.length;
  const current = openIndex === null ? null : sequence[openIndex];

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + total) % total)),
    [total],
  );

  // Where focus came from, so it can be given back on close.
  const openerRef = useRef<HTMLAnchorElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Tab") {
        // Trap: the dialog's controls are the only things reachable while open.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    // Stop the page behind scrolling under the overlay.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [openIndex, close, step]);

  const filters = [{ slug: "all", title: "All Photos" }, ...albums];

  return (
    <>
      <fieldset className="mt-10 border-0 p-0">
        <legend className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Filter by team
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const count =
              filter.slug === "all"
                ? albums.reduce((n, a) => n + a.photos.length, 0)
                : albums.find((a) => a.slug === filter.slug)?.photos.length ?? 0;
            return (
              <label key={filter.slug} className="cursor-pointer">
                <input
                  type="radio"
                  name="album"
                  value={filter.slug}
                  checked={activeSlug === filter.slug}
                  onChange={() => {
                    setActiveSlug(filter.slug);
                    setOpenIndex(null);
                  }}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-strong hover:border-accent-strong">
                  {filter.title}
                  <span className="text-xs font-normal opacity-70">{count}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p aria-live="polite" className="mt-4 text-sm text-text-muted">
        Showing {total} {total === 1 ? "photo" : "photos"}
        {activeSlug !== "all" && ` from ${albums.find((a) => a.slug === activeSlug)?.title}`}.
      </p>

      {shown.map((album) => (
        <section key={album.slug} aria-labelledby={`album-${album.slug}`} className="mt-12">
          <h2
            id={`album-${album.slug}`}
            className="font-display text-2xl font-bold uppercase tracking-tight text-primary"
          >
            {album.title}
            <span className="ml-3 text-sm font-normal normal-case tracking-normal text-text-muted">
              {album.photos.length} photos
            </span>
          </h2>

          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((photo, index) => {
              const seqIndex = sequence.findIndex((s) => s.photo.id === photo.id);
              return (
                <li key={photo.id}>
                  <a
                    href={assetPath(photo.src)}
                    onClick={(event) => {
                      // Let modified clicks (new tab, save) behave normally.
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      openerRef.current = event.currentTarget;
                      setOpenIndex(seqIndex);
                    }}
                    className="group block overflow-hidden rounded-sm bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                  >
                    <Image
                      src={assetPath(photo.thumb)}
                      alt={photoAlt(photo, index, album.photos.length, album.title)}
                      width={photo.thumbWidth}
                      height={photo.thumbHeight}
                      loading="lazy"
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${current.album.title}, photo ${current.indexInAlbum + 1} of ${current.albumTotal}`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 backdrop-blur-sm"
          onClick={(event) => {
            // Clicking the backdrop closes; clicking the image does not.
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="flex items-center justify-between gap-4 text-white">
            <p className="text-sm">
              <span className="font-semibold">{current.album.title}</span>
              <span className="text-white/60">
                {" "}
                · {current.indexInAlbum + 1} of {current.albumTotal}
              </span>
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-sm border border-white/25 p-2 transition-colors hover:border-accent hover:text-accent"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
            <Image
              key={current.photo.id}
              src={assetPath(current.photo.src)}
              alt={photoAlt(
                current.photo,
                current.indexInAlbum,
                current.albumTotal,
                current.album.title,
              )}
              width={current.photo.width}
              height={current.photo.height}
              priority
              sizes="100vw"
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>

          {total > 1 && (
            <div className="flex items-center justify-center gap-4 text-white">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="rounded-sm border border-white/25 p-2 transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <span className="text-xs text-white/60">
                Use the arrow keys · Esc to close
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="rounded-sm border border-white/25 p-2 transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
