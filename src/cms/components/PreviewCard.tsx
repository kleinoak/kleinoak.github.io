"use client";

/**
 * Shows an entry exactly as the public site renders it, by reusing the real
 * site components. If a card changes, the preview changes with it — there is
 * no second copy of the design to keep in sync.
 */
import { AnnouncementCard } from "@/components/cards/AnnouncementCard";
import type { AnnouncementFlyer } from "@/data/announcements";
import { EventCard } from "@/components/cards/EventCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { CoachCard } from "@/components/cards/CoachCard";
import { ResourceCard } from "@/components/cards/ResourceCard";
import { SponsorLogoCard } from "@/components/cards/SponsorLogoCard";
import type { Collection } from "../schema";
import type { JsonObject } from "../validation";

function text(item: JsonObject, key: string, fallback = ""): string {
  const value = item[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function lines(item: JsonObject, key: string): string[] | undefined {
  const value = item[key];
  if (!Array.isArray(value)) return undefined;
  const kept = value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
  return kept.length > 0 ? kept : undefined;
}

/**
 * A half-filled image field is the normal state while an editor is uploading
 * one, so anything without both a source and real dimensions is treated as no
 * image rather than rendered as a broken one.
 */
function image(item: JsonObject, key: string): AnnouncementFlyer | undefined {
  const value = item[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const photo = value as JsonObject;
  if (typeof photo.src !== "string" || photo.src.trim() === "") return undefined;
  if (typeof photo.width !== "number" || typeof photo.height !== "number") return undefined;
  return {
    src: photo.src,
    alt: typeof photo.alt === "string" ? photo.alt : "",
    width: photo.width,
    height: photo.height,
    thumb: typeof photo.thumb === "string" ? photo.thumb : undefined,
    thumbWidth: typeof photo.thumbWidth === "number" ? photo.thumbWidth : undefined,
    thumbHeight: typeof photo.thumbHeight === "number" ? photo.thumbHeight : undefined,
  };
}

export function PreviewCard({ collection, item }: { collection: Collection; item: JsonObject }) {
  switch (collection.preview) {
    case "announcement":
      return (
        <AnnouncementCard
          announcement={{
            id: text(item, "id", "preview"),
            date: text(item, "date", "Date"),
            startDate: text(item, "startDate") || undefined,
            endDate: text(item, "endDate") || undefined,
            title: text(item, "title", "Untitled"),
            summary: text(item, "summary"),
            time: text(item, "time") || undefined,
            location: text(item, "location") || undefined,
            details: lines(item, "details"),
            flyer: image(item, "flyer"),
            actionLabel: text(item, "actionLabel") || undefined,
            actionHref: text(item, "actionHref") || undefined,
            archived: item.archived === true,
            verified: item.verified === true,
          }}
        />
      );

    case "event":
      return (
        <EventCard
          event={{
            id: text(item, "id", "preview"),
            startDate: text(item, "startDate"),
            date: text(item, "date", "Date"),
            time: text(item, "time") || undefined,
            title: text(item, "title", "Untitled"),
            location: text(item, "location") || undefined,
            status: item.status === "tentative" ? "tentative" : "confirmed",
          }}
        />
      );

    case "team":
      return (
        <TeamCard
          team={{
            slug: text(item, "slug", "preview"),
            name: text(item, "name", "Untitled"),
            level: text(item, "level", "Level"),
            description: text(item, "description"),
          }}
        />
      );

    case "coach":
      return (
        <CoachCard
          coach={{
            name: text(item, "name", "Coach"),
            title: text(item, "title", "Title"),
            bioAvailable: item.bioAvailable === true,
          }}
        />
      );

    case "resource":
      return (
        <ResourceCard
          resource={{
            id: text(item, "id", "preview"),
            title: text(item, "title", "Untitled"),
            description: text(item, "description"),
            href: text(item, "href") || undefined,
            verified: item.verified === true,
            note: text(item, "note") || undefined,
          }}
        />
      );

    case "sponsorTier": {
      const sponsors = Array.isArray(item.sponsors) ? (item.sponsors as string[]) : [];
      return (
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-accent-strong">
            {text(item, "name", "Tier")} · {text(item, "price")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sponsors
              .filter((name) => name.trim() !== "")
              .map((name) => (
                <SponsorLogoCard key={name} name={name} />
              ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
