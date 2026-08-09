# Klein Oak Volleyball Website — Current-State Evaluation

Reference site: https://www.kleinoakvolleyball.com/ (evaluated 2026-08-02, via automated content fetch — no login, no production access, no changes made)

This document evaluates the current public Wix-hosted site as a **reference only**. It is the basis for a local modernization prototype built in this repository. It does not reflect any change made to the live site.

## 1. Executive Summary

The current site is a Wix template site that gets the basics across — team pages, a schedule link, booster club info, sponsorships — but it under-serves its three real audiences (prospective players/parents, current team parents, sponsors). Content is thin, several pages are placeholder or stale ("2022 Schedule" URL slug showing a "2026 SCHEDULE" heading, two of three coach photos marked "coming soon", copyright footer reads "©2023"), the schedule is a flat image instead of readable data, and there's no mobile-first design system — it's a generic drag-and-drop template with default spacing and no consistent visual identity beyond a logo and school colors.

## 2. Current Strengths

- Clear top-level information architecture: Teams (Varsity/JV/Freshman), Coaches, Schedule, Booster Club, Sponsorships, Spirit Wear.
- Real, current content exists and is maintained: 2026 booster club officer roster, camp pricing/dates, tryout dates, sponsorship tiers and pricing, a "Meet the Panthers" event.
- Sponsor tiering (Platinum/Gold/Black) is a real, working concept worth preserving.
- Direct integration with Klein ISD's official systems (Rank One parent portal and camp registration) rather than reinventing scheduling/registration.
- Active social presence across four platforms (Facebook, Instagram, TikTok, Twitter/X).

## 3. Major Usability Issues

- **Schedule is an image, not data.** `/2022-schedule` embeds `Schedule.png` — not selectable, not screen-reader accessible, not scannable, doesn't work well on small screens, can't be filtered by team.
- **No unified "what do I need to know right now" surface.** Camp dates, tryout dates, and the "Meet the Panthers" event are scattered across the homepage and sub-pages with no consistent card/date treatment.
- **Dead-ended user journeys.** A prospective parent researching tryouts has to piece together info from the homepage, the schedule page, and Rank One's external camp store — there's no single "Camps & Tryouts" hub.
- **Coach page is mostly empty.** 2 of 3 coaches are placeholder photos with zero bio/contact info, which undersells the program to prospective families.
- **Stale/inconsistent labeling.** URL slug says `2022-schedule` while the heading says "2026 SCHEDULE"; footer copyright says "©2023" in 2026.
- **No roster or team content beyond a single photo** on the Varsity page — no differentiation between Varsity/JV/Freshman beyond the page existing.

## 4. Visual Design Issues

- Generic Wix template aesthetics: default card shadows/spacing, no evidence of a deliberate type scale or spacing system.
- No visible consistent color system tied to Klein Oak Panther branding (black/vegas gold) applied across components — sponsor tier names ("Black Sponsor") hint at a palette that isn't otherwise expressed in the UI.
- Sponsor logos presented without a consistent sizing/whitespace treatment (typical Wix logo-grid pitfall).
- No hero section with a clear value proposition — first-time visitors don't get a "who we are" moment.

## 5. Content Organization Issues

- Booster Club and Sponsorships are siblings under one "Booster Club" nav item, but they serve very different audiences (volunteer parents vs. paying sponsors) and would benefit from being surfaced independently.
- Camps, tryouts, and the parent portal link are buried in a generic "Important Links and Dates" block rather than a dedicated, task-oriented page.
- No parent-resources hub (forms, portal links, spirit wear, communication channels) — Spirit Wear is a top-level nav item but resource links are scattered.

## 6. Accessibility Concerns

- Schedule delivered purely as a raster image with no accompanying structured/text alternative — inaccessible to screen readers and unreadable when zoomed.
- Wix default templates commonly ship low-contrast text-over-photo treatments and non-semantic heading structures; nothing on the fetched pages suggested a deliberate heading hierarchy.
- No indication of skip-navigation, visible focus states, or reduced-motion handling (typical gaps in template-built sites).

## 7. Mobile Experience Concerns

- Image-based schedule will not scale/reflow and requires pinch-zoom on phones.
- Wix's default mobile nav collapses many items into a "More" bucket, which obscures Sponsorships/Booster Club sub-items on small screens.
- No evidence of touch-target sizing considerations for nav/buttons.

## 8. Recommended Modernization Strategy

Build a statically-generated Next.js + TypeScript + Tailwind prototype that:
1. Establishes a real design system (Panther black/gold palette, type scale, spacing scale, reusable components) instead of ad hoc template styling.
2. Converts the schedule and camp/tryout info from an image/scattered-text into structured, accessible, filterable data-driven UI.
3. Creates a dedicated **Camps & Tryouts** hub and a **Resources** hub, matching how the three primary audiences (prospective players/parents, current parents, sponsors) actually navigate.
4. Preserves everything that already works: sponsor tiers, booster board roster, Rank One integrations, social links, Teams/Coaches structure.
5. Clearly marks anything not yet verifiable (rosters, stats, full coach bios, exact schedule opponents/times) as a placeholder/empty state rather than inventing it.

## 9. Proposed Information Architecture

```
Home
Teams
  ├─ Varsity
  ├─ Junior Varsity
  └─ Freshman
Coaches
Schedule
Camps & Tryouts
Resources          (parent portal, spirit wear, forms, FAQs)
Sponsors            (formerly "Sponsorships", promoted to top-level)
Contact             (booster club board + contact email + socials)
```

"Booster Club Board" content is folded into the Contact/About area rather than kept as its own nav item, since its real content (officer list + contact email) fits naturally there. "Coaches" is kept as a top-level destination (mirroring the live site's "The Coaches"), so the staff has a place to grow bios and photos as the program publishes them.

## 10. Implementation Plan

1. Scaffold Next.js (App Router) + TypeScript + Tailwind CSS in this repo.
2. Build design tokens (colors, type scale, spacing) as Tailwind theme extensions + CSS variables.
3. Build reusable components: Header/desktop nav, mobile nav (accessible disclosure), Footer, Button, SectionHeading, AnnouncementCard, EventCard, TeamCard, ResourceCard, SponsorLogoCard, EmptyState.
4. Build a typed content layer (`src/data/*.ts`) for announcements, events/schedule, teams, camps/tryouts, sponsors, resources, booster board — populated only with verified content gathered from the live site, with placeholders clearly labeled where data is unavailable (e.g., full game-by-game schedule, coach bios, rosters).
5. Build pages: Home, Teams (+3 team detail pages), Schedule, Camps & Tryouts, Sponsors, Resources, Contact.
6. Apply responsive rules across the 320–1440px+ breakpoint range and accessibility requirements (semantic HTML, focus states, contrast, reduced motion, alt text).
7. Validate locally: install, dev server, `next build`, lint, manual responsive/a11y pass. No deployment.
