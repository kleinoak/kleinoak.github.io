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
      {/* Edge to edge on a phone, like the VBIF slide. See CampaignBanner. */}
      <Container className="flex h-full flex-col items-center justify-center gap-5 pt-10 pb-20 max-sm:px-0 sm:pt-12 lg:pt-14">
        <Link
          href="/gallery"
          className="group block w-full max-w-full rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:max-w-[34rem] lg:max-w-[31rem]"
        >
          <Image
            src={assetPath("/images/brand/banner-waller-isd-champion.webp")}
            alt="Champions — 9-0 to win the Waller ISD tournament"
            width={1376}
            height={768}
            sizes="(min-width: 1024px) 31rem, (min-width: 640px) 34rem, 100vw"
            // Mounted from the first paint with the other slides; yields
            // bandwidth to the hero logo. See CampaignBanner.
            fetchPriority="low"
            className="h-auto w-full rounded-sm transition-transform duration-300 group-hover:scale-[1.01] max-sm:rounded-none"
          />
          {/* The image is full-bleed below `sm`, so the call to action needs
              its own gutter or it starts at the screen edge. */}
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-accent group-hover:underline max-sm:px-4">
            See the photos
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </Link>
      </Container>
    </section>
  );
}
