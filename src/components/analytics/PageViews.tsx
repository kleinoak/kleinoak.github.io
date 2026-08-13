"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 `page_view` when the App Router changes route.
 *
 * `<GoogleAnalytics>` from @next/third-parties only injects gtag.js, which
 * sends one `page_view` for the document that loaded. Every navigation after
 * that is a client-side pushState, so without this a visit reports as a single
 * page however many pages the visitor actually read — verified by instrumenting
 * sendBeacon/fetch/XHR and navigating: zero hits fired.
 *
 * `usePathname` only — deliberately not `useSearchParams`, which forces a
 * Suspense boundary in a statically exported route and puts the *fallback* in
 * the prerendered HTML. No route on this site is distinguished by a query
 * string.
 *
 * IMPORTANT: turn **off** Enhanced measurement → "Page changes based on
 * browser history events" in the GA4 property. If Google's own history
 * listener is active as well, every navigation is counted twice.
 */
export function PageViews() {
  const pathname = usePathname();
  // The document load already produced a page_view via gtag's config call;
  // firing again here would double-count the landing page.
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
