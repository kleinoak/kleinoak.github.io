import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { assetPath } from "@/lib/asset";
import { Container } from "@/components/ui/Container";

/**
 * Waller ISD tournament win, as the third hero slide.
 *
 * The whole banner is the link — a visitor who reacts to "CHAMPIONS!" should
 * not have to hunt for a small target — with a visible call to action so it
 * reads as clickable rather than as decoration.
 *
 * The alt text carries the banner's own words. The artwork is an image of text
 * (WCAG 1.4.5), so without that a screen-reader user gets nothing at all; the
 * headline cannot be recovered any other way.
 */
export function ChampionBanner() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <Container className="flex h-full flex-col items-center justify-center gap-5 py-10 sm:py-12 lg:py-14">
        <Link
          href="/gallery"
          className="group block w-full max-w-full rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:max-w-[30rem] lg:max-w-[31rem]"
        >
          <Image
            src={assetPath("/images/brand/banner-waller-isd-champion.webp")}
            alt="Champions — 9-0 to win the Waller ISD tournament"
            width={1376}
            height={768}
            sizes="(min-width: 1024px) 31rem, (min-width: 640px) 30rem, 100vw"
            className="h-auto w-full rounded-sm transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-accent group-hover:underline">
            See the photos
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </Link>
      </Container>
    </section>
  );
}
