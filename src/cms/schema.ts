/**
 * The content model.
 *
 * Every editable thing on the site is described here once, and three places
 * read it: the admin forms at /admin, the change summaries shown before
 * publishing, and `scripts/validate-content.ts` (which runs before every build
 * and on every pull request). Adding a field means editing this file and the
 * matching type in `src/data/` — nothing else.
 *
 * This file is imported by Node directly (type-stripping), so it must stay
 * dependency-free and free of TypeScript-only runtime features.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "slug"
  | "url"
  | "email"
  | "link"
  | "select"
  | "boolean"
  | "number"
  | "stringList"
  | "image";

export type SelectOption = {
  value: string;
  label: string;
};

export type Field = {
  /** Key in the JSON object. Dotted paths are allowed (e.g. `socials.facebook`). */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  maxLength?: number;
  rows?: number;
  /** Label for one entry of a `stringList` field, e.g. "sponsor". */
  itemNoun?: string;
  /** `slug` fields can be generated from another field when left blank. */
  deriveFrom?: string;
};

export type Collection = {
  /** Stable key used in URLs (`/admin#/announcements`) and draft storage. */
  name: string;
  label: string;
  group: string;
  /** Repo-relative path of the JSON file holding this content. */
  file: string;
  kind: "list" | "singleton";
  description: string;
  /** Where this content shows up on the site — displayed to editors. */
  usedOn: string[];
  /** Field whose value titles a row in the editor list. */
  labelField?: string;
  /** Field that must be unique across items (also used to match items in diffs). */
  identifierField?: string;
  /** Wording for the "add" button, e.g. "Add announcement". */
  itemNoun?: string;
  /** Card component used for the live preview, if any. */
  preview?:
    | "announcement"
    | "event"
    | "team"
    | "coach"
    | "coachProfile"
    | "spiritEvent"
    | "resource"
    | "sponsorTier";
  fields: Field[];
};

const verifiedField: Field = {
  name: "verified",
  label: "Verified",
  type: "boolean",
  help: "On means the Booster Club has confirmed this is accurate. Unverified items are shown with a caution note.",
};

export const collections: Collection[] = [
  {
    name: "announcements",
    label: "Announcements",
    group: "Program news",
    file: "content/announcements.json",
    kind: "list",
    description:
      "The Announcements cards on the home page. Newest first — the page shows them in this order. Anything whose date has passed moves itself into the archive behind the 'View archive' button; nothing needs deleting when an event is over.",
    usedOn: ["Home page"],
    labelField: "title",
    identifierField: "id",
    itemNoun: "announcement",
    preview: "announcement",
    fields: [
      {
        name: "id",
        label: "ID",
        type: "slug",
        required: true,
        deriveFrom: "title",
        help: "Internal only — lowercase letters, numbers and dashes. Generated from the title if you leave it blank.",
      },
      {
        name: "date",
        label: "Date",
        type: "text",
        required: true,
        placeholder: "Thursday, August 6",
        help: "Written the way it should read on the page, e.g. 'Monday, August 3'. Use 'Ongoing' for something with no fixed date.",
      },
      {
        name: "startDate",
        label: "Sort date",
        type: "text",
        placeholder: "2026-10-01",
        help: "YYYY-MM-DD, and it must be the real calendar date. The day after it passes, this announcement moves itself into the archive. Leave blank for something with no end date, like a donation drive — that one stays current until you tick Archived.",
      },
      {
        name: "endDate",
        label: "Last day",
        type: "text",
        placeholder: "2026-10-03",
        help: "Only for something running over several days. It archives the day after this, not after the sort date.",
      },
      { name: "title", label: "Title", type: "text", required: true, maxLength: 80 },
      {
        name: "summary",
        label: "Summary",
        type: "textarea",
        required: true,
        rows: 3,
        maxLength: 300,
        help: "One or two sentences. Keep it short — this is a card, not an article.",
      },
      {
        name: "time",
        label: "Time",
        type: "text",
        placeholder: "4:00 PM – 9:30 PM",
        help: "Optional. Shown next to the date on the card.",
      },
      {
        name: "location",
        label: "Location",
        type: "text",
        placeholder: "24345 Gosling Rd, Spring, TX 77389",
        help: "Optional. A venue and address, or where to drop something off.",
      },
      {
        name: "details",
        label: "Details",
        type: "stringList",
        itemNoun: "line",
        help: "One short line each — what to bring, what to mention, who it helps. These appear when a reader opens the announcement, not on the card.",
      },
      {
        name: "flyer",
        label: "Flyer",
        type: "image",
        help: "Optional poster. It is cropped to a strip on the card and shown whole when the announcement is opened, so the alt text must carry everything the poster says — a reader who cannot see it gets nothing else.",
      },
      {
        name: "actionLabel",
        label: "Link text",
        type: "text",
        help: "Optional. Leave both link fields blank for an announcement with no button.",
      },
      {
        name: "actionHref",
        label: "Link address",
        type: "link",
        help: "A page on this site (e.g. /schedule) or a full https:// address.",
      },
      {
        name: "archived",
        label: "Archived",
        type: "boolean",
        help: "On moves this into the archive immediately, whatever the dates say. This is the only way to retire an announcement that has no sort date.",
      },
      verifiedField,
    ],
  },
  {
    name: "spiritEvents",
    label: "Spirit calendar",
    group: "Program news",
    file: "content/spirit-events.json",
    kind: "list",
    description:
      "The 'Upcoming Events at a Glance' cards on the home page — themes, spirit nights and drives. Not the schedule: start times live in Key dates and the match schedule, and a date that carries a time in two files will eventually carry two different times. Anything whose date has passed drops off the page on its own.",
    usedOn: ["Home page"],
    labelField: "date",
    identifierField: "id",
    itemNoun: "event",
    preview: "spiritEvent",
    fields: [
      { name: "id", label: "ID", type: "slug", required: true, help: "Internal only — lowercase letters, numbers and dashes." },
      {
        name: "startDate",
        label: "Sort date",
        type: "text",
        required: true,
        placeholder: "2026-09-08",
        help: "YYYY-MM-DD, the real calendar date. The card disappears from the home page the day after it passes.",
      },
      {
        name: "endDate",
        label: "Last day",
        type: "text",
        placeholder: "2026-09-25",
        help: "Only for something running over several days, like a donation drive.",
      },
      {
        name: "date",
        label: "Date label",
        type: "text",
        required: true,
        placeholder: "September 8",
        help: "How the date should read on the card, e.g. 'September 8' or 'September 21–25'.",
      },
      {
        name: "kind",
        label: "Kind",
        type: "select",
        required: true,
        options: [
          { value: "game", label: "Game" },
          { value: "spirit-night", label: "Spirit night (restaurant)" },
          { value: "drive", label: "Donation drive" },
        ],
      },
      {
        name: "homeAway",
        label: "Home or away",
        type: "select",
        options: [
          { value: "home", label: "Home" },
          { value: "away", label: "Away" },
        ],
        help: "Games only. Check it against the schedule page — the two must agree.",
      },
      { name: "opponent", label: "Opponent", type: "text", placeholder: "Klein Forest", help: "Games only." },
      {
        name: "title",
        label: "Title",
        type: "text",
        placeholder: "Spirit Night at Center Court Pizza",
        help: "For anything that is not a game. A game builds its own title from the opponent.",
      },
      {
        name: "themeLabel",
        label: "Theme name",
        type: "text",
        placeholder: "Gold Out",
        help: "Optional. The dress-up theme, e.g. 'Gold Out', 'White Hot', 'Black Out'.",
      },
      {
        name: "themeTone",
        label: "Theme colour",
        type: "select",
        options: [
          { value: "gold", label: "Gold" },
          { value: "white", label: "White" },
          { value: "black", label: "Black" },
        ],
        help: "Which colour the theme actually is. This draws the stripe across the top of the card and the dot on the chip — the name alone cannot be coloured in.",
      },
      {
        name: "occasion",
        label: "Occasion",
        type: "text",
        placeholder: "Senior Night",
        help: "Optional. Who is being honoured — Senior Night, Alumni Night, Teacher Appreciation Night.",
      },
      {
        name: "rally",
        label: "Rally cry",
        type: "text",
        placeholder: "Tame the Tigers!",
        help: "Optional. The line shown large and in gold — used on away games and drives.",
      },
      {
        name: "detail",
        label: "Detail",
        type: "textarea",
        required: true,
        rows: 3,
        maxLength: 300,
        help: "One or two sentences, in the program's own voice.",
      },
      { name: "location", label: "Location", type: "text", help: "Spirit nights — the restaurant address." },
      { name: "time", label: "Time", type: "text", placeholder: "4:00 PM – 9:30 PM", help: "Spirit nights only." },
      {
        name: "announcementId",
        label: "Linked announcement ID",
        type: "text",
        help: "Optional. The id of the Announcement that carries this event's flyer, so the two are traceable to each other. Not shown on the page.",
      },
    ],
  },
  {
    name: "events",
    label: "Key dates",
    group: "Program news",
    file: "content/events.json",
    kind: "list",
    description:
      "Program-wide dates: tryouts, roster postings, first practice, Meet the Panthers. This is not the game-by-game schedule — that lives in Klein ISD's Rank One system.",
    usedOn: ["Home page — Upcoming Events", "Schedule page"],
    labelField: "title",
    identifierField: "id",
    itemNoun: "date",
    preview: "event",
    fields: [
      { name: "id", label: "ID", type: "slug", required: true, deriveFrom: "title" },
      {
        name: "startDate",
        label: "Sort date",
        type: "text",
        required: true,
        placeholder: "2026-08-06",
        help: "YYYY-MM-DD, and it must be the real calendar date — the home page uses it to decide what is still upcoming. For a multi-day event use the first day.",
      },
      {
        name: "date",
        label: "Date",
        type: "text",
        required: true,
        placeholder: "August 6",
        help: "Short form — it is printed inside a small date block, e.g. 'August 1 & 3'.",
      },
      { name: "time", label: "Time", type: "text", placeholder: "6:00 PM", help: "Optional." },
      { name: "title", label: "Event", type: "text", required: true, maxLength: 80 },
      {
        name: "location",
        label: "Location",
        type: "text",
        placeholder: "Klein Oak High School Gym",
        help: "Optional.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "confirmed", label: "Confirmed" },
          { value: "tentative", label: "Tentative" },
        ],
        help: "Tentative dates are badged on the page so families know they may move.",
      },
      verifiedField,
    ],
  },
  {
    name: "teams",
    label: "Teams",
    group: "Program",
    file: "content/teams.json",
    kind: "list",
    description: "The three program levels. Each team gets its own page at /teams/<web address>.",
    usedOn: ["Home page — Team Experience", "Teams page", "Team detail pages"],
    labelField: "name",
    identifierField: "slug",
    itemNoun: "team",
    preview: "team",
    fields: [
      {
        name: "slug",
        label: "Web address",
        type: "slug",
        required: true,
        deriveFrom: "name",
        help: "Used in the page address: /teams/varsity. Changing it breaks links people have already shared — and the menu links in the site header, which a developer must update to match.",
      },
      { name: "name", label: "Team name", type: "text", required: true },
      {
        name: "level",
        label: "Level label",
        type: "text",
        required: true,
        placeholder: "Freshmen & Flex",
        help: "The small label above the team name.",
      },
      { name: "description", label: "Description", type: "textarea", required: true, rows: 3, maxLength: 400 },
      {
        name: "photo",
        label: "Team photo",
        type: "image",
        help: "Optional. Only use photos the program has permission to publish.",
      },
      {
        name: "roster",
        label: "Roster",
        type: "stringList",
        itemNoun: "player",
        help: "One player per line. Order does not matter — the site sorts the roster alphabetically by first name — so a new player can just be added at the end. These are student names: only publish a roster the program has already made public, and remove it when the season ends.",
      },
    ],
  },
  {
    name: "matches",
    label: "Match schedule",
    group: "Schedule",
    file: "content/matches.json",
    kind: "list",
    description:
      "The full season schedule — preseason, district, and playoffs — with a start time per level. Rank One remains the live source of truth for last-minute changes; this is the program's published plan.",
    usedOn: ["Schedule page", "Home page — Upcoming Events"],
    labelField: "opponent",
    identifierField: "id",
    itemNoun: "match",
    fields: [
      { name: "id", label: "ID", type: "slug", required: true, deriveFrom: "opponent" },
      {
        name: "startDate",
        label: "Sort date",
        type: "text",
        placeholder: "2026-08-18",
        help: "YYYY-MM-DD, the real calendar date — the home page uses it to decide what is still upcoming, so a match without one never appears there. For a tournament use the first day. Leave blank only while the program has not announced a date.",
      },
      {
        name: "endDate",
        label: "Last day",
        type: "text",
        placeholder: "2026-08-22",
        help: "Optional — multi-day tournaments only. Keeps the event on the home page until it has finished.",
      },
      {
        name: "results.varsity",
        label: "Varsity result",
        type: "text",
        placeholder: "W 3–0",
        help: "Copied from that team's own Rank One calendar — \"W 3–0\", \"L 0–2\", or a record like \"9–0\" for a tournament played across several matches. Leave blank when no result has been posted; blank shows as a dash and is never read as a loss.",
      },
      {
        name: "results.jv",
        label: "Junior Varsity result",
        type: "text",
        placeholder: "L 0–2",
        help: "Same as the varsity result, from the JV calendar.",
      },
      {
        name: "results.flex",
        label: "Flex result",
        type: "text",
        help: "The flex calendar has not published scores so far; fill this in if it starts to.",
      },
      {
        name: "results.freshmen",
        label: "Freshman result",
        type: "text",
        help: "The freshman calendar has not published scores so far; fill this in if it starts to.",
      },
      {
        name: "status",
        label: "Status on the home page",
        type: "select",
        options: [
          { value: "", label: "Work it out from the times" },
          { value: "confirmed", label: "Confirmed" },
          { value: "tentative", label: "Tentative" },
        ],
        help: "Left alone, a date shows as Confirmed unless every level's time is TBD. Set it explicitly when that guess is wrong — a tournament can be locked in long before its start times are published.",
      },
      {
        name: "section",
        label: "Part of season",
        type: "select",
        required: true,
        options: [
          { value: "preseason", label: "Preseason" },
          { value: "district", label: "District season" },
          { value: "playoffs", label: "Playoffs" },
        ],
      },
      { name: "day", label: "Day", type: "text", placeholder: "Tuesday", help: "Optional." },
      {
        name: "date",
        label: "Date",
        type: "text",
        placeholder: "Sep 15",
        help: "Short form, e.g. 'Aug 20–22'. Leave blank if the program has not listed one.",
      },
      { name: "opponent", label: "Opponent or event", type: "text", required: true },
      {
        name: "location",
        label: "Location",
        type: "text",
        placeholder: "Home",
        help: "'Home', 'Away', or the venue name.",
      },
      {
        name: "times.varsity",
        label: "Varsity time",
        type: "text",
        help: "A time, or 'TBD' when the date is set but the time is not. Use 'x' when this level is not playing — that is what hides the date from this level's filter, so a varsity-only tournament needs 'x' on the other three levels or a JV parent still sees it. Leave blank only when nothing at all has been published for this level yet; blank keeps the row visible with a dash.",
      },
      { name: "times.jv", label: "Junior Varsity time", type: "text" },
      { name: "times.flex", label: "Flex time", type: "text" },
      { name: "times.freshmen", label: "Freshman time", type: "text" },
      {
        name: "note",
        label: "Note",
        type: "text",
        help: "Optional — shown under the row, e.g. a full address or travel instruction.",
      },
    ],
  },
  {
    name: "coaches",
    label: "Coaches",
    group: "Program",
    file: "content/coaches.json",
    kind: "list",
    description:
      "Coaching staff shown on the Coaches page, in this order — the program introduces them by seniority rather than alphabetically, so the head coach goes first.",
    usedOn: ["Coaches page"],
    labelField: "name",
    identifierField: "name",
    itemNoun: "coach",
    preview: "coachProfile",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Bill Jenkins" },
      {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
        placeholder: "Head Varsity Coach",
        help: "The role as the program words it, e.g. 'Assistant Varsity & Junior Varsity Head Coach'.",
      },
      {
        name: "bio",
        label: "Bio",
        type: "textarea",
        rows: 6,
        maxLength: 900,
        help: "The coach's own words. Publish what the coach wrote rather than rewriting it — and check with them before changing anything that names their family.",
      },
      {
        name: "photo",
        label: "Portrait",
        type: "image",
        help: "Optional. A coach with no portrait gets their initials instead, which is a deliberate look rather than a gap. Only use a photo the coach has chosen for the website — and note that a photo including their family is on a public page, which is a different thing from a staff meeting.",
      },
      {
        name: "bioAvailable",
        label: "Bio published",
        type: "boolean",
        help: "Off shows 'Bio coming soon' and hides the text without deleting it — which is what you want if a coach asks for theirs to come down.",
      },
    ],
  },
  {
    name: "administration",
    label: "Program administration",
    group: "Program",
    file: "content/administration.json",
    kind: "list",
    description:
      "School staff above the volleyball program — athletic director, principal. Shown on the Coaches page below the coaching staff.",
    usedOn: ["Coaches page"],
    labelField: "name",
    identifierField: "name",
    itemNoun: "staff member",
    preview: "coach",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Brandon Carpenter" },
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Athletic Director" },
    ],
  },
  {
    name: "resources",
    label: "Parent resources",
    group: "Program",
    file: "content/resources.json",
    kind: "list",
    description: "Links families need most: the parent portal, camp registration, spirit wear, Booster Club contact.",
    usedOn: ["Resources page"],
    labelField: "title",
    identifierField: "id",
    itemNoun: "resource",
    preview: "resource",
    fields: [
      { name: "id", label: "ID", type: "slug", required: true, deriveFrom: "title" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true, rows: 3, maxLength: 300 },
      {
        name: "href",
        label: "Link address",
        type: "link",
        help: "A full https:// address, a mailto: address, or a page on this site. Leave blank for an information-only card.",
      },
      verifiedField,
      {
        name: "note",
        label: "Caution note",
        type: "text",
        help: "Shown in amber when 'Verified' is off — say what still needs confirming.",
      },
    ],
  },
  {
    name: "booster-board",
    label: "Booster Club board",
    group: "Program",
    file: "content/booster-board.json",
    kind: "list",
    description: "Booster Club officers listed on the Contact page.",
    usedOn: ["Contact page"],
    labelField: "name",
    itemNoun: "officer",
    fields: [
      { name: "role", label: "Role", type: "text", required: true, placeholder: "President" },
      { name: "name", label: "Name", type: "text", required: true },
    ],
  },
  {
    name: "sponsor-tiers",
    label: "Sponsor tiers",
    group: "Sponsors",
    file: "content/sponsor-tiers.json",
    kind: "list",
    description:
      "Sponsorship levels and the businesses in each one. Tiers publish in this order, and the order sets how big the logos are drawn: the first tier's are the largest, the second tier's are smaller, and every tier below that shares one size. Reordering this list therefore changes who is most prominent on the page.",
    usedOn: ["Home page — Sponsors", "Sponsors page"],
    labelField: "name",
    identifierField: "id",
    itemNoun: "tier",
    preview: "sponsorTier",
    fields: [
      { name: "id", label: "ID", type: "slug", required: true, deriveFrom: "name" },
      { name: "name", label: "Tier name", type: "text", required: true, placeholder: "Platinum Sponsor" },
      { name: "price", label: "Amount", type: "text", required: true, placeholder: "$1,000+" },
      {
        name: "sponsors",
        label: "Sponsors",
        type: "stringList",
        itemNoun: "sponsor",
        help: "One business name per line. A name shows as text unless a matching entry exists in Sponsor logos, in which case the artwork is shown instead. Only publish artwork the sponsor has supplied for that purpose.",
      },
    ],
  },
  {
    name: "sponsor-logos",
    label: "Sponsor logos",
    group: "Sponsors",
    file: "content/sponsor-logos.json",
    kind: "list",
    description:
      "Artwork for the businesses listed in Sponsor tiers. A sponsor with no entry here is shown as its name instead, so artwork is never required to list a sponsor.",
    usedOn: ["Home page — Sponsors", "Sponsors page"],
    labelField: "name",
    identifierField: "name",
    itemNoun: "logo",
    fields: [
      {
        name: "name",
        label: "Business name",
        type: "text",
        required: true,
        placeholder: "Stewart Builders",
        help: "Must match the name in Sponsor tiers exactly, character for character — that is how the logo is matched to the sponsor.",
      },
      {
        name: "logo",
        label: "Logo",
        type: "image",
        required: true,
        help: "Upload the artwork supplied by the sponsor. Landscape marks read best; the card scales anything to fit without cropping. Send a file with a white or transparent background — the plate behind every logo is white, so a dark-background image shows as a dark rectangle.",
      },
    ],
  },
  {
    name: "sponsor-steps",
    label: "How to sponsor",
    group: "Sponsors",
    file: "content/sponsor-steps.json",
    kind: "singleton",
    description: "The numbered steps a business follows to become a sponsor.",
    usedOn: ["Sponsors page"],
    fields: [
      {
        name: "steps",
        label: "Steps",
        type: "stringList",
        required: true,
        itemNoun: "step",
        help: "Shown as a numbered list, in this order.",
      },
    ],
  },
  {
    name: "site",
    label: "Site settings",
    group: "Settings",
    file: "content/site.json",
    kind: "singleton",
    description:
      "Program name, tagline, contact address and social links. These appear in the header, hero, footer and on the contact page.",
    usedOn: ["Every page"],
    fields: [
      { name: "name", label: "Program name", type: "text", required: true },
      { name: "shortName", label: "Short name", type: "text", required: true, help: "Used where space is tight." },
      { name: "mascot", label: "Mascot", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text", required: true, maxLength: 80 },
      {
        name: "taglineIsPrototypeCopy",
        label: "Tagline is placeholder copy",
        type: "boolean",
        help: "Turn on only if the tagline is a stand-in the Booster Club has not approved. Off means the wording is official.",
      },
      { name: "contactEmail", label: "Contact email", type: "email", required: true },
      { name: "parentPortalUrl", label: "Parent portal link", type: "url", required: true },
      {
        name: "rankOneScheduleUrl",
        label: "Rank One schedule link",
        type: "url",
        required: true,
        help: "The program's live Rank One schedule — the source of truth for last-minute changes.",
      },
      {
        name: "sponsorFormUrl",
        label: "Sponsorship form",
        type: "text",
        required: true,
        placeholder: "/documents/sponsor-letter-2025-2026.pdf",
        help: "Path to the sponsorship letter PDF in public/, linked from the Sponsors page. Replace the file each season and update this path.",
      },
      { name: "socials.facebook", label: "Facebook", type: "url" },
      { name: "socials.instagram", label: "Instagram", type: "url" },
      { name: "socials.tiktok", label: "TikTok", type: "url" },
      { name: "socials.twitter", label: "X / Twitter", type: "url" },
    ],
  },
];

export function getCollection(name: string): Collection | undefined {
  return collections.find((collection) => collection.name === name);
}

export function collectionGroups(): { group: string; collections: Collection[] }[] {
  const groups: { group: string; collections: Collection[] }[] = [];
  for (const collection of collections) {
    let bucket = groups.find((entry) => entry.group === collection.group);
    if (!bucket) {
      bucket = { group: collection.group, collections: [] };
      groups.push(bucket);
    }
    bucket.collections.push(collection);
  }
  return groups;
}
