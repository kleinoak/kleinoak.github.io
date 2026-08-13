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
 * the banner changes, which is the most irritating thing a carousel can do.
 */
export function CampaignBanner() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <Container className="flex h-full items-center justify-center py-20 sm:py-24 lg:py-28">
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
          sizes="(min-width: 1024px) 43rem, (min-width: 640px) 42rem, 100vw"
          className="h-auto w-full max-w-full sm:max-w-2xl lg:max-w-[43rem]"
        />
      </Container>
    </section>
  );
}
