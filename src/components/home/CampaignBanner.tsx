import Image from "next/image";
import { assetPath } from "@/lib/asset";
import { Container } from "@/components/ui/Container";

/**
 * The VBIF campaign banner, shown as the second hero slide.
 *
 * The artwork carries its own wordmark, so nothing is overlaid on it — any
 * heading or call to action here would be invented copy. The image is never
 * cropped: this is a logo lockup, and `cover` would cut the mark in half at
 * narrow widths.
 *
 * The padding matches Hero's exactly and the width is capped so the rendered
 * height lands on Hero's. Slides of different heights make the page jump when
 * the banner changes, which is the most irritating thing a carousel can do —
 * though HeroCarousel now stacks the slides so the box is the tallest one's
 * height regardless, and matching here is belt-and-braces rather than the only
 * defence.
 */
export function CampaignBanner() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Edge to edge on a phone. The gutters bought nothing here — the artwork
          is already dark and self-contained — and the extra 32px of width is
          height the banner does not have to give back to the letterbox. */}
      <Container className="flex h-full items-center justify-center pt-10 pb-20 max-sm:px-0 sm:pt-12 lg:pt-14">
        <Image
          // WebP, not the supplied PNG: the artwork is a photographic render,
          // which PNG stores terribly (1,096 KB → 34 KB at visually identical
          // quality). Next's image optimiser is off for the static export, so
          // whatever is committed here is exactly what visitors download. The
          // original is kept in logo-redesign/ for re-export.
          src={assetPath("/images/brand/vbif-campaign.webp")}
          alt="VBIF"
          width={1376}
          height={768}
          sizes="(min-width: 1024px) 35.5rem, (min-width: 640px) 38rem, 100vw"
          // Every slide is now in the DOM from the first paint, so this
          // downloads on load even though slide one is what's showing. Low
          // priority keeps it out of the hero logo's way on a phone connection.
          fetchPriority="low"
          className="h-auto w-full max-w-full sm:max-w-[38rem] lg:max-w-[35.5rem]"
        />
      </Container>
    </section>
  );
}
