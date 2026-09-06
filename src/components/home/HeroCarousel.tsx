"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export type HeroSlide = {
  id: string;
  /** Names the slide in the dots, the live region, and the control labels. */
  label: string;
  node: ReactNode;
};

/** Long enough to read a banner without it feeling like a slot machine. */
const ROTATE_MS = 7000;

/**
 * Rotating hero.
 *
 * **The height is set by CSS, never measured.** All slides are stacked in one
 * grid cell, so the browser sizes the box to the tallest of them at whatever
 * the current width is. The height is therefore correct in the server-rendered
 * HTML, correct before hydration, correct with JavaScript off, and identical no
 * matter which slide is showing — the page below cannot move when the banner
 * changes.
 *
 * It used to measure instead: hold the tallest height seen so far, and drop
 * that floor on `resize` so a desktop measurement would not leave a black band
 * after rotating to a phone. On a phone that is a trap. Scrolling in iOS Safari
 * collapses the URL bar, which fires `resize`, which dropped the floor — the
 * hero went 677px to 318px and yanked the whole page up 359px under the
 * reader's thumb, mid-scroll, with no banner change involved at all. Measuring
 * a layout in JavaScript is what created that bug; the layout engine already
 * knows the answer.
 *
 * Only the active slide is visible, and the rest are `visibility: hidden` plus
 * `inert`. That was the reason the old version mounted one slide at a time —
 * a slide hidden with `opacity` or `display` sleight-of-hand still holds
 * focusable links, and tabbing into content nobody can see is the classic
 * carousel bug. `visibility: hidden` reserves the space while removing its
 * subtree from the tab order and the accessibility tree, and `inert` states it
 * outright. Both, and the layout stays honest.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Hovering, or tabbing into the banner, suspends rotation without changing
  // the play/pause state the visitor chose.
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Rotating a banner nobody is looking at is motion for its own sake, and on a
  // phone the hero is off-screen for most of the visit. Assume visible so the
  // carousel still works if the observer never reports.
  const [onScreen, setOnScreen] = useState(true);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = regionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      // Any sliver counts: a banner half out of frame is still being read.
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  // Reduced motion means no automatic movement at all — the visitor advances it
  // themselves. WCAG 2.2.2 also requires a way to stop anything that moves for
  // more than five seconds, which is what the pause button is for.
  const rotating =
    playing && !interacting && !reduceMotion && onScreen && slides.length > 1;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [rotating, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index];

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        }
      }}
    >
      {/* Every slide in row 1, column 1. The row is auto-sized, so its height
          is the tallest slide's — recomputed by the browser on every reflow,
          which is the part JavaScript kept getting wrong. */}
      <div className="grid">
        {slides.map((slide, position) => {
          const isActive = position === index;
          return (
            <div
              key={slide.id}
              // `grid` again so a slide shorter than the row stretches to fill
              // it rather than leaving a gap below.
              className={`col-start-1 row-start-1 grid ${
                isActive ? (reduceMotion ? "" : "animate-hero-slide") : "invisible"
              }`}
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${slides.length}: ${slide.label}`}
              aria-hidden={isActive ? undefined : true}
              inert={!isActive}
            >
              {slide.node}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          {/* The arrows sit in the control lane with the dots, not floating at
              mid-height over the artwork. Mid-height put them wherever the
              slide's own content happened to be: they cut the ends off "Klein
              Oak High School · Panther Volleyball" on a phone and clipped the
              panther mark at exactly 1024px, where the hero turns into a row.
              Down here they are over reserved black at every width, and on a
              phone they are within reach of a thumb rather than halfway up the
              screen. */}
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous banner"
            className="absolute bottom-4 left-2 rounded-sm border border-white/25 bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next banner"
            className="absolute bottom-4 right-2 rounded-sm border border-white/25 bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>

          {/* The control lane. This pill floats over the foot of whichever
              slide is showing, so every slide reserves `pb-20` for it rather
              than trusting that its content happens to stop short — a new slide
              that fills its own height would otherwise put the dots on top of
              its own call to action, which is exactly what the hero did.

              `pointer-events-none` on this wrapper, `auto` on the pill itself.
              `inset-x-0` is only here to centre the pill, but it makes the
              wrapper a full-width transparent strip that is painted after the
              arrows and swallowed every click on them — the arrows were dead on
              every screen while the dots inside this div still worked. A layout
              box that spans the carousel must not also be a click target. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-2 backdrop-blur-sm">
              {slides.map((slide, position) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(position)}
                  aria-label={`Show ${slide.label}`}
                  aria-current={position === index ? "true" : undefined}
                  className={`h-2.5 rounded-full transition-all ${
                    position === index ? "w-6 bg-accent" : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
              {!reduceMotion && (
                <button
                  type="button"
                  onClick={() => setPlaying((value) => !value)}
                  aria-label={playing ? "Pause banner rotation" : "Play banner rotation"}
                  className="ml-1 text-white/70 transition-colors hover:text-accent"
                >
                  {playing ? (
                    <Pause aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <Play aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Announced on change so the slide swap is not silent to a screen reader. */}
      <p aria-live="polite" className="sr-only">
        {`Banner ${index + 1} of ${slides.length}: ${active.label}`}
      </p>
    </div>
  );
}
