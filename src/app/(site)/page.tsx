import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CampaignBanner } from "@/components/home/CampaignBanner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickAccess } from "@/components/home/QuickAccess";
import { Announcements } from "@/components/home/Announcements";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeamExperience } from "@/components/home/TeamExperience";
import { Culture } from "@/components/home/Culture";
import { SponsorsSection } from "@/components/home/SponsorsSection";

// Authorship credit, home page only. `other` is used rather than Next's
// `authors` field because that emits only <meta name="author"> plus a
// <link rel="author">; these three need to render under exact names.
export const metadata: Metadata = {
  other: {
    author: "EngineerBC",
    "author-email": "bc.grep@gmail.com",
    "author-website": "codinci.com",
  },
};

export default function Home() {
  return (
    <>
      {/* The program hero is first, so it is what renders on load — and the
          only one that renders at all without JavaScript. */}
      <HeroCarousel
        slides={[
          { id: "panthers", label: "Panther Volleyball", node: <Hero /> },
          { id: "vbif", label: "VBIF", node: <CampaignBanner /> },
        ]}
      />
      <QuickAccess />
      <Announcements />
      <UpcomingEvents />
      <TeamExperience />
      <Culture />
      <SponsorsSection />
    </>
  );
}
