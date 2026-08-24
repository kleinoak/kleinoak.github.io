// Site-wide settings. The values live in `content/site.json` and are edited
// through the in-repo CMS at /admin — see PROJECT-DOCUMENTATION.md.
// Reference data was gathered from the program's previous website (2026-08-02),
// which lived at kleinoakvolleyball.com until this site took that domain over.
import siteJson from "@content/site.json";

export type Site = {
  name: string;
  shortName: string;
  mascot: string;
  tagline: string;
  taglineIsPrototypeCopy: boolean;
  contactEmail: string;
  parentPortalUrl: string;
  rankOneScheduleUrl: string;
  /** Path under `public/`, so it must go through `assetPath()` before use. */
  sponsorFormUrl: string;
  socials: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
};

export const site: Site = siteJson;

// Navigation is intentionally NOT editable in the CMS: every entry maps to a
// route that only exists if a developer builds the page for it. Adding a link
// here without a matching route produces a 404, so this stays in code.
export const nav = [
  { label: "Home", href: "/" },
  {
    label: "Teams",
    href: "/teams",
    children: [
      { label: "Varsity", href: "/teams/varsity" },
      { label: "Junior Varsity", href: "/teams/junior-varsity" },
      { label: "Flex", href: "/teams/flex" },
      { label: "Freshman", href: "/teams/freshman" },
    ],
  },
  { label: "Coaches", href: "/coaches" },
  { label: "Schedule", href: "/schedule" },
  { label: "Gallery", href: "/gallery" },
  { label: "Resources", href: "/resources" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Contact", href: "/contact" },
] as const;
