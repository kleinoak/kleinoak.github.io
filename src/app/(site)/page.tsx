import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
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
      <Hero />
      <QuickAccess />
      <Announcements />
      <UpcomingEvents />
      <TeamExperience />
      <Culture />
      <SponsorsSection />
    </>
  );
}
