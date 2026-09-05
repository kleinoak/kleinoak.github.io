import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnnouncementsBrowser } from "@/components/home/AnnouncementsBrowser";
import { announcements, splitAnnouncements } from "@/data/announcements";
import { programDate } from "@/data/calendar";

/**
 * The build-time split is what lands in the prerendered HTML, so it is what a
 * crawler and a reader with JavaScript disabled get. `AnnouncementsBrowser`
 * re-runs the same pure function in the browser against the real date.
 */
export function Announcements() {
  const initial = splitAnnouncements(announcements, programDate());

  return (
    <section aria-labelledby="announcements-heading" className="py-16 sm:py-20">
      <Container>
        <div id="announcements-heading">
          <SectionHeading eyebrow="Stay Informed" title="Announcements" />
        </div>
        <AnnouncementsBrowser announcements={announcements} initial={initial} />
      </Container>
    </section>
  );
}
