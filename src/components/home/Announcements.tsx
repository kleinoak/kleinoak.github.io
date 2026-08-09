import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnnouncementCard } from "@/components/cards/AnnouncementCard";
import { announcements } from "@/data/announcements";
import { EmptyState } from "@/components/ui/EmptyState";

export function Announcements() {
  return (
    <section aria-labelledby="announcements-heading" className="py-16 sm:py-20">
      <Container>
        <div id="announcements-heading">
          <SectionHeading eyebrow="Stay Informed" title="Announcements" />
        </div>
        {announcements.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="No announcements right now"
              description="Check back soon, or follow the program on social media for the latest updates."
            />
          </div>
        )}
      </Container>
    </section>
  );
}
