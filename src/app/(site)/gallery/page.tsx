import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { albums, photoCount } from "@/data/gallery";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Panther Volleyball"
        title="Photo Gallery"
        description={`${photoCount} photos from the 2026 season — team portraits for every level, and the Waller ISD tournament run.`}
      />

      <section className="py-16 sm:py-20">
        <Container>
          <GalleryBrowser albums={albums} />
        </Container>
      </section>
    </>
  );
}
