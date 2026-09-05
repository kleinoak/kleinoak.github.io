// Content source: content/announcements.json (edited at /admin).
import announcementsJson from "@content/announcements.json";

/**
 * A flyer as the program hands it over — a poster image, not a photograph of
 * an event.
 *
 * `src`/`alt`/`width`/`height` are the shape the CMS `image` field and
 * `validate-content.mts` both expect, so a flyer uploaded through /admin is
 * valid without any of the rest. `thumb` is the card-sized derivative added by
 * hand; when it is absent the card falls back to `src`, which costs bandwidth
 * but never breaks.
 */
export type AnnouncementFlyer = {
  src: string;
  alt: string;
  width: number;
  height: number;
  thumb?: string;
  thumbWidth?: number;
  thumbHeight?: number;
};

export type Announcement = {
  id: string;
  /** Human-readable, as sourced — this is what renders on the card. */
  date: string;
  /**
   * The real calendar date, YYYY-MM-DD, used only to decide when this moves to
   * the archive. Optional: an announcement with no date never expires on its
   * own (a standing donation drive has no last day).
   */
  startDate?: string;
  /** Final day of a multi-day announcement; absent for single-day ones. */
  endDate?: string;
  title: string;
  summary: string;
  /** Short supporting lines shown in the detail dialog, e.g. what to bring. */
  details?: string[];
  time?: string;
  location?: string;
  actionLabel?: string;
  actionHref?: string;
  flyer?: AnnouncementFlyer;
  /** Forces the archive regardless of date — the only lever an undated item has. */
  archived?: boolean;
  verified: boolean;
};

export const announcements: Announcement[] = announcementsJson;

/**
 * Has this announcement stopped being news?
 *
 * Two ways in, because two kinds of announcement exist:
 *
 * - **Dated** ones archive themselves the day after they happen, the same way
 *   `upcomingFrom` retires a calendar entry. Nobody has to remember to move a
 *   Spirit Night on the morning after it ran.
 * - **Undated** ones — a pantry drive with a drop-off location and no last day
 *   — cannot be archived by a rule, so `archived: true` is the switch. Without
 *   it an undated announcement stays current forever, which is the safe
 *   direction to fail: it is visible and can be taken down, rather than
 *   silently disappearing on a date nobody chose.
 */
export function isArchived(announcement: Announcement, today: string): boolean {
  if (announcement.archived) return true;
  const lastDay = announcement.endDate ?? announcement.startDate;
  return lastDay !== undefined && lastDay < today;
}

export type AnnouncementSplit = {
  current: Announcement[];
  archived: Announcement[];
};

/**
 * Split the feed into what is current and what is archived, preserving the
 * order the content file is written in — the schema tells editors it is
 * newest-first and the home page honours that.
 *
 * Pure, like `upcomingFrom`: give it a date and it gives you the split, which
 * is what lets the browser re-run it against the real clock.
 */
export function splitAnnouncements(
  list: Announcement[],
  today: string,
): AnnouncementSplit {
  const current: Announcement[] = [];
  const archived: Announcement[] = [];
  for (const announcement of list) {
    (isArchived(announcement, today) ? archived : current).push(announcement);
  }
  return { current, archived };
}
