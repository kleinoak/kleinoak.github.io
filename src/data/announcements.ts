// Content source: content/announcements.json (edited at /admin).
import announcementsJson from "@content/announcements.json";

export type Announcement = {
  id: string;
  date: string; // human-readable, as sourced
  title: string;
  summary: string;
  actionLabel?: string;
  actionHref?: string;
  verified: boolean;
};

export const announcements: Announcement[] = announcementsJson;
