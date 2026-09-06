import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CampaignBanner } from "@/components/home/CampaignBanner";
import { ChampionBanner } from "@/components/home/ChampionBanner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickAccess } from "@/components/home/QuickAccess";
import { Announcements } from "@/components/home/Announcements";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { SpiritCalendar } from "@/components/home/SpiritCalendar";
import { TeamExperience } from "@/components/home/TeamExperience";
import { Culture } from "@/components/home/Culture";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { programDate } from "@/data/calendar";
import {
  groupByMonth,
  spiritEvents,
  upcomingSpiritEvents,
} from "@/data/spiritEvents";

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
          { id: "champions", label: "Waller ISD Champions", node: <ChampionBanner /> },
        ]}
      />
      <QuickAccess />
      {/* The spirit calendar leads, ahead of the announcements: it is the
          thing the program most wants a visitor to act on — which night, what
          to wear, what to bring — and the announcements are the standing
          notices behind it. Upcoming Events follows with when each level
          actually plays.

          Build-time grouping is passed in so the prerendered HTML is complete;
          the component re-filters against the real date on mount.

          Backgrounds alternate down the page — surface, white, surface — so the
          three run together as bands rather than one wall. QuickAccess above is
          also `surface`, but it is a compact bordered bar rather than a padded
          section, so it reads as part of the header region. */}
      <SpiritCalendar
        events={spiritEvents}
        initial={groupByMonth(upcomingSpiritEvents(spiritEvents, programDate()))}
      />
      <Announcements />
      <UpcomingEvents />
      <TeamExperience />
      <Culture />
      <SponsorsSection />
    </>
  );
}
