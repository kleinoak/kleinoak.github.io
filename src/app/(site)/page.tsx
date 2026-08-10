import { Hero } from "@/components/home/Hero";
import { QuickAccess } from "@/components/home/QuickAccess";
import { Announcements } from "@/components/home/Announcements";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeamExperience } from "@/components/home/TeamExperience";
import { Culture } from "@/components/home/Culture";
import { SponsorsSection } from "@/components/home/SponsorsSection";

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
