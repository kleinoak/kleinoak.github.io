import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Announcement } from "@/data/announcements";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="flex flex-col gap-3 rounded-sm border border-border bg-background p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
        <Calendar aria-hidden="true" className="h-4 w-4" />
        <time>{announcement.date}</time>
      </div>
      <h3 className="font-display text-xl font-semibold uppercase tracking-tight text-primary">
        {announcement.title}
      </h3>
      <p className="text-sm text-text-muted">{announcement.summary}</p>
      {announcement.actionHref && announcement.actionLabel && (
        <Link
          href={announcement.actionHref}
          className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline"
        >
          {announcement.actionLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
