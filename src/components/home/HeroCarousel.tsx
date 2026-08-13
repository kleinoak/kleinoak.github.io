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
 * Only the active slide is mounted, rather than hiding the others with CSS.
 * That is the difference between a carousel that works with a keyboard and one
 * that does not: a hidden slide still contains focusable links, and tabbing
 * into content nobody can see is the classic carousel accessibility bug.
 *
 * The first slide is rendered on the server, so it is what a visitor sees
 * before hydration — and the whole of it, with JavaScript off. The controls
 * simply do nothing in that case.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Hovering, or tabbing into the banner, suspends rotation without changing
  // the play/pause state the visitor chose.
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Slides are different heights — a stacked hero on a phone is roughly twice
  // a banner image — and only one is mounted at a time, so the page would jump
  // by hundreds of pixels on every change. Hold the tallest height seen and
  // let shorter slides sit inside it. Undefined until measured, so the
  // server-rendered markup carries no height and nothing shifts on hydration.
  const slideRef = useRef<HTMLDivElement>(null);
  const [floor, setFloor] = useState<number>();

  useEffect(() => {
    const element = slideRef.current;
    if (!element) return;

    const remember = () =>
      setFloor((tallest) => Math.max(tallest ?? 0, element.getBoundingClientRect().height));

    remember();
    const observer = new ResizeObserver(remember);
    observer.observe(element);

    // Drop the floor on a viewport change: a height measured at desktop width
    // would otherwise leave a tall empty band after rotating to a phone.
    const reset = () => setFloor(undefined);
    window.addEventListener("resize", reset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reset);
    };
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
  const rotating = playing && !interacting && !reduceMotion && slides.length > 1;

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
      {/* `grid` so a slide shorter than the floor stretches to fill it rather
          than leaving a gap below. */}
      <div
        ref={slideRef}
        key={active.id}
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${slides.length}: ${active.label}`}
        style={floor ? { minHeight: floor } : undefined}
        className={`grid ${reduceMotion ? "" : "animate-hero-slide"}`}
      >
        {active.node}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/3 -translate-y-1/2 sm:top-1/2 rounded-sm border border-white/25 bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/3 -translate-y-1/2 sm:top-1/2 rounded-sm border border-white/25 bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-2 backdrop-blur-sm">
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
