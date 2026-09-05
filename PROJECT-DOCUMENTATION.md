# KLEIN OAK VOLLEYBALL — Project Documentation

**The Klein Oak Panther Volleyball website and its database-free content editor**

---

## Overview

`ko-volleyball-web` is the modernized website for the Klein Oak High School Panther Volleyball program: teams, key dates, match schedule, coaches, a season photo gallery, sponsors, parent resources, and contact information. It is a Next.js App Router site exported as fully static HTML and served by GitHub Pages.

Bolted onto that static site is a content management system with **no server and no database**. The editor lives at `/admin`, runs entirely in the browser, and uses the GitHub repository itself as its data store. Content is JSON in `content/`; publishing is a commit; deploying is a GitHub Actions run.

---

## Purpose

The volleyball program is run by coaches and Booster Club volunteers and has **no budget for hosted infrastructure** — no Contentful, no Sanity, no Netlify CMS backend, no database, no monthly bill. It also has no dedicated developer on call for routine content updates.

The system exists so that a parent or volunteer with a GitHub account, invited as a repository collaborator, can change dates, announcements, rosters, sponsors, and contact details on the live website without touching code, running a build, or asking anyone for help — while a developer keeps a full, reviewable git history of every change.

Cost of running this system: **$0**.

---

## Architecture Summary

The unusual part of this architecture is that the CMS has no backend of its own. The editor's browser talks straight to GitHub's REST API using the editor's own credentials; GitHub Actions then rebuilds and redeploys the site.

```
┌───────────────────────────────────────────────────────────────────┐
│                      EDITOR'S BROWSER                             │
│                                                                   │
│  /admin  — statically exported React app (src/cms)                │
│    SignIn ─ token pasted by the editor, kept in this browser only │
│    CollectionEditor / ItemForm / FieldInput ─ schema-driven forms │
│    PreviewCard ─ renders the real site card while editing         │
│    PublishPanel ─ plain-English diff, then commit or open a PR    │
│                                                                   │
│  localStorage / sessionStorage: token, repo target, drafts, media │
└───────────────────────────────────────────────────────────────────┘
                    ↕ HTTPS — api.github.com, editor's own token
┌───────────────────────────────────────────────────────────────────┐
│                    GITHUB — THE ONLY BACKEND                      │
│                                                                   │
│  Repository = database.  content/*.json = the tables.             │
│  Git Data API: blob → tree → commit → ref (one commit per publish)│
│  Non-forced ref update ⇒ concurrent publishes are rejected,       │
│  never silently overwritten.                                      │
│  Collaborator write access = authorization. Git log = audit log.  │
└───────────────────────────────────────────────────────────────────┘
                    ↕ push to main  /  pull request
┌───────────────────────────────────────────────────────────────────┐
│                       GITHUB ACTIONS                              │
│                                                                   │
│  deploy.yml        (push to main) validate → build → Pages deploy │
│  pull-request.yml  (PR)  validate → lint → typecheck → build      │
└───────────────────────────────────────────────────────────────────┘
                    ↕ static artifact
┌───────────────────────────────────────────────────────────────────┐
│                        GITHUB PAGES                               │
│                                                                   │
│  Static HTML/CSS/JS from `out/`. No Node runtime, no database,    │
│  no hosting cost. Images served from public/images/uploads.       │
└───────────────────────────────────────────────────────────────────┘
```

**Read path (the public site).** `content/*.json` is imported at build time by the thin typed loaders in `src/data/*.ts`, which the page components consume exactly as they consumed hardcoded data before. Content is baked into the HTML — the live site never calls GitHub, and visitors never load the CMS.

**Write path (the editor).** `/admin` reads the same JSON files over the GitHub API, hands them to schema-generated forms, and writes them back as one commit.

---

## Technical Stack

| Component | Technology | Role |
|---|---|---|
| **Framework** | Next.js 16.2.12 (App Router, Turbopack) | Site and `/admin` app |
| **Export mode** | `output: "export"` | Fully static HTML — no Node server at runtime |
| **Language** | TypeScript (strict) | Site, CMS, and the validator script |
| **Styling** | Tailwind CSS v4 (`@theme inline` tokens) | Panther black/gold design system |
| **Icons** | `lucide-react` + inline SVG brand marks | UI and social icons |
| **Content store** | JSON files in `content/`, committed to git | The "database" |
| **CMS backend** | GitHub REST API (Git Data API) from the browser | Auth, read, write, history |
| **CMS auth** | GitHub fine-grained personal access token | Identity + authorization |
| **Image pipeline** | `createImageBitmap` + `<canvas>` in the browser | Resize before commit |
| **Validation** | `src/cms/validation.ts`, shared by editor and CI | One rule set, three consumers |
| **CI/CD** | GitHub Actions | Validate, build, deploy to Pages |
| **Hosting** | GitHub Pages | Free static hosting |

---

## Content Model

Every editable thing on the site is declared once in `src/cms/schema.ts`. Three consumers read that declaration: the `/admin` forms, the pre-publish change summaries, and `scripts/validate-content.mts`. Adding a field means editing the schema and the matching type in `src/data/` — nothing else.

| Collection | Kind | File | Appears on |
|---|---|---|---|
| Announcements | list | `content/announcements.json` | Home page — cards, and the archive behind them |
| Key dates | list | `content/events.json` | Home page, Schedule |
| Teams | list | `content/teams.json` | Home, Teams, team detail pages |
| Match schedule | list | `content/matches.json` | Schedule |
| Coaches | list | `content/coaches.json` | Coaches — name, title, bio, portrait |
| Program administration | list | `content/administration.json` | Coaches |
| Parent resources | list | `content/resources.json` | Resources |
| Booster Club board | list | `content/booster-board.json` | Contact |
| Sponsor tiers | list | `content/sponsor-tiers.json` | Home page, Sponsors |
| Sponsor logos | list | `content/sponsor-logos.json` | Home page, Sponsors |
| How to sponsor | singleton | `content/sponsor-steps.json` | Sponsors |
| Site settings | singleton | `content/site.json` | Every page |

**Two content files are generated, not edited: `gallery.json` and `rankone.json`.** Neither is in the schema, so `/admin` never shows them and `validate-content.mts` ignores both. The gallery's reasons are below; the Rank One feed's are in [Keeping the schedule in sync](#keeping-the-schedule-in-sync).

**The photo gallery is deliberately *not* a collection.** `content/gallery.json` sits beside the twelve files above but is **generated** — `scripts/build-gallery.mjs` writes it — and is not in the schema, so `/admin` never shows it and `validate-content.mts` ignores it. Two reasons it is built rather than edited: a hundred-odd photos added one at a time through the editor would be miserable, and every field in the manifest (derivative paths, pixel dimensions) is a value an editor has no way to supply correctly. To add photos, drop a folder under `content/images/` and re-run the script. See [The photo gallery](#the-photo-gallery) below.

**Why sponsor logos are a separate collection.** A tier's `sponsors` is a `stringList`, which cannot hold objects, so the artwork cannot live inside the tier. `sponsor-logos.json` is joined to a tier entry by exact business name. A sponsor with no matching entry renders as its name instead — so a business can be listed the moment it signs up, without waiting on artwork. The join is by name, which means **renaming a sponsor in one file and not the other silently drops the logo**; nothing validates the pairing.

**Field types**: `text`, `textarea`, `slug`, `url`, `email`, `link`, `select`, `boolean`, `number`, `stringList`, `image`. Fields carry `required`, `maxLength`, `help`, `placeholder`, `options`, and `deriveFrom` (a slug generated from another field when left blank). Dotted names address nested keys (`socials.facebook`).

**Collection metadata** that drives the editor UI: `group` (sidebar grouping), `description` and `usedOn` (so an editor knows where a change will show up), `labelField` (row titles), `identifierField` (uniqueness, and how items are matched when diffing), `itemNoun` ("Add announcement"), and `preview` (which real site card to render live beside the form).

**Results come from Rank One, per level.** A match may carry `results`, an object keyed by level — `"W 3–0"`, `"L 0–2"`, or a record like `"9–0"` for a tournament the site keeps as one row and Rank One lists as nine matches. **Every level has its own Rank One calendar** (varsity `Tm=18086`, JV `18087`, flex `195078`, freshman `22683`), and a level appears here only when its own calendar posts a score: as of 2026-08-25 that is varsity and JV, while the flex and freshman calendars carry no scores at all.

The display follows from that, in two shapes, because four extra columns will not fit:

- **All-levels view** — each result sits directly under that level's start time, with an `sr-only` "Result:" so it is not read as another time. A row where varsity won and JV lost has to be able to say both.
- **Filtered to one level** — the result gets its own column, and only in a section that has at least one. A level with nothing posted is shown no column at all; an always-empty column would imply that team's results were missing rather than untracked.

**A missing result means no result has been posted — never a loss and never a cancellation.** In the column it renders as a dash with "No result posted" for screen readers; under a start time it renders as nothing at all, since four dashes stacked beneath four times would be noise rather than a statement.

**"x" and blank are different, and Rank One decides which.** A level absent from its own calendar on a date is not playing, which is `"x"`; a blank is "no entry published at all". Only `"x"` is load-bearing: **the level filter hides `"x"` rows and keeps blank ones**, showing a dash. So a varsity-only tournament must carry `"x"` on the other three levels, or a JV parent filtering to JV still sees it sitting in their schedule.

That is not hypothetical — the Pearland and Legends Invitational rows shipped with blanks on 2026-08-25 and put a Legends Invitational into the JV view, where JV has no entry within a week of those dates. The only signal a reader gets is a dash they have to interpret; `"x"` removes the date instead, and the filter reports how many it removed.

**`site.scheduleUpdated` is the date of the last reconciliation**, shown on the Schedule page inside the Rank One callout as "Times and results on this page last checked against Rank One on …". It is the freshness of the *check*, not of the data — update it whenever someone verifies against Rank One, even when nothing changed, because "checked and unchanged" is the useful signal. Left blank, the line disappears rather than printing "unknown".

**Some content is ordered by code, not by the file.** A team's `roster` is sorted alphabetically by first name in `src/data/teams.ts`, not by however the names sit in `content/teams.json` — so a player appended at the bottom of the list in `/admin` still lands in the right place on the page. The stored file is kept in the same order anyway, so the editor shows what the page will show. Sorting uses `localeCompare`, because at least one name carries a typographic apostrophe and code-point order would put it somewhere no reader expects. **Coaches are deliberately *not* sorted** — that list is ordered by seniority, and alphabetising it would destroy information.

**The `verified` flag.** Several collections carry a `verified` boolean. Off means the Booster Club has not confirmed the item; the site renders it with a visible caution note. This is deliberate — the prototype was built without authoritative source data, and unverified content is marked rather than quietly presented as fact.

---

## Publishing Flow

1. **Sign in.** The editor pastes a GitHub fine-grained personal access token at `/admin`. The app calls `GET /user` and `GET /repos/{owner}/{repo}`, and refuses to continue unless `permissions.push` is true — a read-only collaborator gets a plain-English explanation instead of a broken editor.
2. **Load.** All thirteen content files are read at the configured branch. Each is stored with its blob SHA as the *baseline*.
3. **Edit.** Changes are held as *drafts* in `localStorage`, keyed by collection, stamped with the baseline SHA they started from. A draft whose baseline SHA no longer matches the file on the branch is flagged **stale** — someone else published in the meantime.
4. **Validate as you type.** Field-level rules run live; the publish button is blocked while any collection has blocking issues.
5. **Review.** `changes.ts` diffs baseline against draft and produces a human summary: entries added, removed, reordered, and every changed field rendered as `from → to`. This is what a volunteer checks before committing.
6. **Publish**, one of two modes:
   - **Publish now** — one commit straight onto `main` via the Git Data API (blob → tree → commit → `PATCH ref` with `force: false`). Actions rebuilds and deploys.
   - **Ask for review first** — creates a branch `cms/<login>-<timestamp>`, commits there, and opens a pull request whose body is the same change summary in Markdown. A developer or lead reviews and merges; merging publishes.
7. **Deploy.** `deploy.yml` validates content, builds, writes `.nojekyll`, and deploys `out/` to GitHub Pages.

**One publish is one commit**, even when it touches several files plus newly uploaded photos — one review, one build, one deploy. The final ref update is a non-forced fast-forward, so a concurrent publish is rejected by GitHub with a 409/422, surfaced as *"Someone else may have published while you were editing — reload the latest content and try again."*

**Images.** Uploads are resized in the browser to a longest side of 1800px before they are ever committed (a 6 MB phone photo becomes roughly 300 KB, keeping git history usable), warned about above ~1.5 MB, and staged in `localStorage` until publish. Only images actually referenced by the edited content are included in the commit; they land in `public/images/uploads/` and are served from `/images/uploads/`.

---

## Authentication & Security

- **No accounts, no passwords, no user table.** Identity is the editor's own GitHub account, proven by a fine-grained personal access token that the editor generates and pastes in.
- **Authorization is repository collaborator access.** Write access to the repo *is* permission to publish; revoking collaborator access revokes publishing. There is no separate role system to keep in sync.
- **Token storage.** `sessionStorage` by default (forgotten when the tab closes); `localStorage` only if the editor ticks "remember on this computer", which the sign-in screen tells them to do only on a personal machine. The token never leaves the browser except in `Authorization` headers to `api.github.com`.
- **Least privilege.** The sign-in screen walks the editor through creating a token scoped to this repository only, with `Contents: Read and write` — nothing else. The screen links directly to GitHub's fine-grained token page.
- **No secrets in the build.** The only build-time environment variables are the public repo coordinates (`NEXT_PUBLIC_GITHUB_OWNER/REPO/BRANCH`) and `NEXT_PUBLIC_BASE_PATH`. None are secret.
- **`/admin` is public but inert.** It is a statically exported page like any other; without a token it does nothing. `public/robots.txt` disallows `/admin` and the route sets `robots: { index: false, follow: false }`.
- **Audit trail.** Every change is a git commit attributed to the editor's GitHub account, with a generated message describing what changed. The editor's overview shows the last eight commits touching `content/`.

> **Note on the trust model:** anyone with write access can publish directly. That is intentional for a small volunteer group. If the program later wants review-before-publish enforced rather than optional, protect `main` with a branch rule requiring pull requests — the "Ask for review first" path already produces exactly those PRs, and `pull-request.yml` already gates them.

---

## Content Safety

The same rule set in `src/cms/validation.ts` is enforced in three places, so a bad edit cannot reach the site:

1. **In the editor, while typing** — field-level issues, shown inline.
2. **At publish time** — publishing is refused if any dirty collection has blocking issues.
3. **In CI** — `scripts/validate-content.mts` runs as `prebuild` locally, and on every push and pull request. It re-parses every JSON file, re-runs the collection rules, and additionally checks that **every photo referenced by content actually exists in `public/`** — catching a hand-edited file or a stale draft that the browser never saw.

The validator is imported directly by Node via type-stripping, which is why `schema.ts` and `validation.ts` must stay dependency-free and free of TypeScript-only runtime features.

**Gallery photos sit outside all three checks.** `content/gallery.json` is generated rather than edited, so it is in no collection and the "every referenced photo exists" pass does not look at it. What stands in for that is the generator: paths in the manifest are written from the files it has just encoded, so the manifest and `public/images/gallery/` can only disagree if one of them is edited or deleted by hand — and a missing derivative shows up as a broken image on the page, not as a failed build.

---

## Development Setup

### Prerequisites
- Node.js ≥ 22 (the validator relies on native TypeScript type-stripping)
- npm
- A GitHub account with write access to the repository, for testing `/admin`

### Running locally

```bash
npm install
npm run dev            # http://localhost:3000 — site, and /admin
npm run validate:content
npm run typecheck
npm run lint
npm run build          # validates content, then exports to out/
npm start              # serves the built out/ on :3000
```

Copy `.env.example` to `.env.local` to point `/admin` at a different repository or to set a base path. Both are public values, not secrets. An editor can also override the repository from the sign-in screen; that override is stored in their browser only.

### Project Layout

```
ko-volleyball-web/
├── content/                        # THE CONTENT STORE (12 editable JSON files)
│   ├── site.json  announcements.json  events.json  teams.json
│   ├── coaches.json  administration.json  matches.json  resources.json
│   ├── booster-board.json  sponsor-tiers.json  sponsor-steps.json
│   ├── sponsor-logos.json          # artwork, joined to a tier by exact name
│   ├── gallery.json                # GENERATED — not a collection, not in /admin
│   └── images/                     # gallery photo drops — GITIGNORED, see below
├── scripts/
│   ├── validate-content.mts        # prebuild + CI content gate
│   ├── build-gallery.mjs           # content/images/ → WebP derivatives + manifest
│   ├── fetch-rankone.mjs           # scrapes the four Rank One calendars
│   └── deploy-prod.sh              # publish to prod WITHOUT the internal docs
├── src/
│   ├── app/
│   │   ├── layout.tsx              # html/body, fonts, GA tag — no header/footer
│   │   ├── icon.svg                # the KO mark, as paths (favicons get no webfont)
│   │   ├── (site)/                 # PUBLIC SITE — header + footer live here
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Home
│   │   │   ├── teams/  teams/[slug]/  coaches/  schedule/  gallery/
│   │   │   └── resources/  sponsors/  contact/
│   │   └── admin/                  # THE EDITOR — full-screen, outside (site)
│   │       ├── layout.tsx          # noindex metadata
│   │       └── page.tsx            # renders <AdminApp />
│   ├── cms/
│   │   ├── schema.ts               # the content model — single source of truth
│   │   ├── validation.ts           # rules shared by editor and CI
│   │   ├── changes.ts              # JSON diff → plain-English summary
│   │   ├── github.ts               # the only backend: GitHub REST/Git Data API
│   │   ├── config.ts               # repo target, media paths, storage keys
│   │   ├── storage.ts              # token, repo override, drafts, staged media
│   │   ├── image.ts                # browser-side resize before commit
│   │   ├── encoding.ts             # UTF-8 ⇄ base64 for the Git blob API
│   │   ├── CmsProvider.tsx         # all editor state; sign-in, drafts, publish
│   │   └── components/
│   │       ├── AdminApp.tsx        # shell, sidebar, hash routing, overview
│   │       ├── SignIn.tsx          # token entry + how-to-get-a-token guide
│   │       ├── CollectionEditor.tsx  ItemForm.tsx  FieldInput.tsx
│   │       ├── PreviewCard.tsx     # real site cards, rendered live
│   │       ├── PublishPanel.tsx    # change review, publish or propose
│   │       └── ui.tsx              # Panel, Banner, AdminButton primitives
│   ├── components/                 # header, footer, cards, home sections
│   │   ├── home/HeroCarousel.tsx   # rotating hero; mounts one slide at a time
│   │   ├── home/CampaignBanner.tsx # the VBIF slide
│   │   ├── home/ChampionBanner.tsx # the Waller ISD slide; links to the gallery
│   │   ├── home/UpcomingEventsList.tsx  # re-filters the dated list in the browser
│   │   ├── home/AnnouncementsBrowser.tsx # cards + detail dialog + archive dialog
│   │   ├── ui/Modal.tsx                 # the shared dialog: trap, Escape, scroll lock
│   │   ├── cards/CoachProfile.tsx       # coach row: circular portrait + bio
│   │   ├── cards/CoachCard.tsx          # compact monogram card — administration
│   │   ├── gallery/GalleryBrowser.tsx   # album filter + grid + lightbox dialog
│   │   ├── schedule/MatchSchedule.tsx   # table + phone cards; varsity results column
│   │   ├── schedule/SyncStatus.tsx      # "last checked" strip above the callout
│   │   └── analytics/PageViews.tsx # GA page_view on client-side route change
│   ├── lib/
│   │   └── asset.ts                # assetPath() — every image src must go through it
│   └── data/                       # thin typed loaders over content/*.json
│       ├── calendar.ts             # merges events + matches into one dated feed
│       ├── announcements.ts        # the feed, plus the current/archived split
│       └── rankone.ts              # venue/result lookups over the scraped feed
├── logo-redesign/                  # brand exploration — logo options + source renders
├── public/
│   ├── images/announcements/       # flyer posters, 2 WebPs each (card + dialog)
│   ├── images/coaches/             # coach portraits, circle-masked WebP with alpha
│   ├── images/brand/               # prepared logo art (hero lockup, banners)
│   ├── images/gallery/             # GENERATED WebP derivatives, 2 per photo
│   ├── images/sponsors/            # sponsor artwork
│   ├── images/uploads/             # photos committed by the editor
│   ├── documents/                  # the sponsorship form PDF
│   └── robots.txt                  # disallows /admin
├── .github/workflows/
│   ├── deploy.yml                  # push to main → validate, build, Pages
│   ├── rankone.yml                 # twice daily → scrape Rank One, commit if changed
│   └── pull-request.yml            # PR → validate, lint, typecheck, build
├── next.config.ts                  # output: "export", basePath, unoptimized images
├── .env.example
├── README.md                       # the only .md that ships to production
├── IDLC.md                         # the originating brief and constraints
├── PROJECT-LOG.md                  # dated record of decisions and trade-offs
├── PROJECT-DOCUMENTATION.md        # this file
├── GITHUB-PROD-SETUP.md            # standing up and deploying to production
├── GOOGLE-ANALYTICS-SETUP.md       # GA4 setup, and the privacy decisions
├── WEBSITE_EVALUATION.md           # evaluation of the original public site
└── IMPLEMENTATION_SUMMARY.md       # the 2026-08-02 prototype build report

(Every .md except README.md is stripped from the production mirror by
scripts/deploy-prod.sh — they are working notes, not part of the site.)
```

**The public site ships six client components, and each earns it.** `Header` (menus), `ScheduleBrowser` (the schedule's team filter), `HeroCarousel` (the rotating hero), `PageViews` (a GA `page_view` on route change, since gtag reports only the document that loaded), `UpcomingEventsList` (re-checks the dated list against the real current date), and `GalleryBrowser` (album filter and lightbox). Everything else is a server component rendered to static HTML at build time.

`HeroCarousel` mounts **one slide at a time** rather than hiding the inactive ones with CSS: a hidden slide still contains focusable links, and tabbing into content nobody can see is the standard carousel accessibility bug. The first slide is server-rendered, so the program hero is the first paint and the only slide that appears with JavaScript disabled.

`ScheduleBrowser` filters in the browser rather than giving each team its own route. That is a deliberate trade: switching teams is instant, and — more importantly — the **complete schedule stays inside the prerendered HTML**, so search engines and a reader with JavaScript disabled still get every date. A `/schedule/varsity/` route would have meant either five near-duplicate pages, or reading the team from a query string with `useSearchParams`, which on a statically exported page requires a `<Suspense>` boundary whose fallback is what lands in the HTML. The cost of the choice is that a filtered view cannot be linked or bookmarked.

The filter is a `<fieldset>` of real radio inputs styled with `peer-checked:`, not buttons with click handlers. Arrow-key navigation, focus management, and the "one of five" relationship announced to screen readers all come from the native control rather than being reimplemented.

**Why the `(site)` route group.** The public header and footer moved out of the root layout into `(site)/layout.tsx` so `/admin` can render as its own full-screen application without the program's navigation wrapped around it. URLs are unchanged — route groups do not appear in paths.

**Every image `src` must go through `assetPath()` (`src/lib/asset.ts`).** `next/image` does not rewrite `src` when the image is `unoptimized` — which it always is here, because Pages cannot run Next's optimizer. A bare `/images/…` src therefore resolves against the *domain* root and 404s whenever the site is served from a sub-path: a GitHub Pages project site, or a folder inside another Pages repo. `assetPath()` prefixes `NEXT_PUBLIC_BASE_PATH`. This applies equally to literal paths in components and to paths coming out of `content/*.json`. Nothing in the build catches a missed call, so the check is `grep` the export for `src="/` paths that lack the base path.

### Keeping the schedule in sync

`scripts/fetch-rankone.mjs` reads the four Rank One calendars — varsity, JV, flex, freshman — and writes `content/rankone.json`. `.github/workflows/rankone.yml` runs it three times a day:

| Cron (UTC) | Central | Why |
|---|---|---|
| `0 11 * * *` | 06:00 | Before the school run. |
| `0 15 * * *` | 10:00 | Catches a morning change to the day's fixtures. |
| `0 4 * * *` | 23:00 (previous evening) | After matches, when scores have usually been posted. |

Those Central times hold during daylight saving, which covers the season. GitHub cron is UTC and does not shift with the clock, so from early November each lands an hour earlier locally.

**It never touches `content/matches.json`.** That file is the curated spine and holds three things the feed does not have: which section a fixture belongs to, the short opponent names a parent recognises ("Lake Creek", not "Lake Creek High School LCHS VB V"), and the `"x"` that means *this level is not playing*, which only exists as an absence upstream. The job writes a separate generated file, so the worst a broken scrape can do is show less enrichment. It cannot corrupt the schedule.

**What the feed adds that the site never had:** the venue, its street address, a Google Maps link, a per-game note, and scores as they are posted.

#### Three things about Rank One, all learned the hard way

- **It 302s a request with no browser `User-Agent`.** The redirect body is 130 bytes, which parses as zero games — so without a status check it fails as "no fixtures" rather than as an error.
- **It rate-limits.** Four requests back to back get 302s even with a good `User-Agent`. Hence a delay between levels and a retry with backoff.
- **Everything useful is in `id="rpt_Games_<field>_<n>"` spans.** The date comes from the hidden `hf_StartDate` field, because the visible label is "Aug 7" with no year.

#### How a feed row is matched to a curated row

Not by opponent — the names do not correspond and a tournament is one curated row against a dozen feed rows. **Venue is matched on date, then checked against the curated location**, and that check is the load-bearing part:

> On 2026-08-08 the site carries both an Oak Ridge scrimmage and team bonding at Bowlero. Rank One lists only the scrimmage. Matching on date alone put **"Oak Ridge HS" under Bowlero** — a wrong address on the page parents use to decide where to drive.

So a named location must be recognisable in the feed's venue name before its address is shown (every significant word must appear — "Klein Oak" and "Klein Forest" share one and are twenty minutes apart). A generic `Home`/`Away` has nothing to check against, so the date must resolve to exactly one **address** — grouped by address rather than name, because a home date lists "Klein Oak Competition Gym" for varsity and "Klein Oak Auxiliary Gym" for freshmen: two rooms, one building. Anything ambiguous renders nothing, which is the right answer: the row still shows Home/Away, without an address the site cannot stand behind.

**Results: curated always wins, and the feed only fills gaps.** A level takes a score from the feed only when it played exactly one game that date, so there is no question which score belongs to which row. A tournament falls through to whatever a person reconciled — which is where records like "9–0" come from and where they have to keep coming from.

**The page says which is which, in two places.** `SyncStatus` sits above the Rank One callout and carries the automated half — "Last checked Sat, Sep 5 at 5:32 PM Central" plus the date the data last actually moved. The callout below keeps the human half: "Start times and tournament records are reconciled by hand — last done on …". Two different claims, so two elements: a parser reading four calendars three times a day, and a person deciding which fixture belongs to which row.

**Two timestamps, and the difference is the point.**

- `checkedAt` — an ISO instant, written on **every** run whether or not anything differed. This is what the page shows.
- `changedAt` — a date, written only when the games themselves differ. This is what answers "is it stale?".

An earlier version wrote one date and **skipped the commit when nothing had changed**, to keep the git history clean. That was the wrong trade: the page could then only say when the data last *changed*, never when it was last *looked at*, and "checked at 6am and nothing had moved" is exactly the reassurance somebody wants the night before a match. `site.scheduleUpdated` already made this call the same way — the schema tells editors to update it even when nothing changed, because "checked and unchanged" is the useful signal.

The cost is three commits a day, each a one-line diff on `checkedAt`, and three CI builds. The commit subject says which kind it was: *"Sync schedule and results from Rank One"* when the fixtures moved, *"Rank One checked — no schedule changes"* when only the clock did.

#### Safety

The job cannot commit a broken scrape. Each level must parse at least a minimum number of games (20/12/10/12) or the fetch retries and then fails the run without writing. `npm run build` then has to pass on the new file before the commit step runs — so a feed change that breaks a type is caught here rather than on somebody's next unrelated push. The push does a `--rebase --autostash` pull first, because three runs a day on a shared branch will eventually collide with a human's commit and the generated file's newest fetch should simply win.

#### Why this does not run in production

The obvious home is `kleinoak/kleinoak.github.io`, since that is what serves the site. **It cannot live there.** `scripts/deploy-prod.sh` publishes with

```bash
git push --force prod <commit>:main
```

where the commit is built from this repository's `main`. Anything committed inside the production repository — by a person or by a job — is discarded by the next deploy. A sync job there would appear to work and then silently lose its data the first time anybody published a content change.

So it runs in the source repository and reaches production the same way every other change does. **The consequence: production is as fresh as the last `deploy-prod.sh`, not as the last sync.** Two ways to close that gap, neither done:

1. **Give the job a deploy key for the production repository** and have it run the strip-and-push itself. Smallest change; needs a secret, and puts an unattended force-push onto production.
2. **Move the fetch into production's own build.** `deploy.yml` there already rebuilds nightly, so it could scrape at build time and fall back to the committed `rankone.json` when Rank One is unreachable. Always fresh, no commits, no force-push conflict — at the cost of a build that depends on a third party being up, and no git history of what the schedule said when.

### The coaches page

Four coaches as full-width profile rows — circular portrait, name, title, bio — then the contact callout, then Program Administration. Content is `content/coaches.json`, editable at `/admin`.

**A row, not a card in a four-across grid.** That grid was right while there was nothing to say and every card held a monogram and a job title. The bios run 55 to 95 words and vary by nearly half; equal-height cards either clip the longest or leave the shortest floating. A row lets each bio be its own length, and the reading measure is capped (`max-w-prose`, list at `max-w-4xl`) because the full container width put ~110 characters on a line.

**Order is seniority, not alphabetical** — head coach first, the way the program introduces its own staff. Nothing sorts `coaches`; the file's order is the page's order, and the schema description says so. This is the opposite of the rosters, which *are* sorted by first name.

**The portraits are circles in the file, not in the CSS.** They were lifted out of the program's "Meet The Coaches" slide deck, where every photo is already circular on a yellow slide, and the mask is baked into each WebP's alpha channel. So the shape on the page is the shape the coach approved, and nothing depends on a `rounded-full` to hide corners that would otherwise carry a slide's background. A coach with no portrait falls back to the initials monogram, which is a deliberate look rather than a gap.

**How they were extracted, because it will come up again.** The deck is a PDF; the pages were rasterised with a small CoreGraphics program (no poppler on this machine) and the slide background flood-filled from the border to isolate each photo. The flood fill is the part worth remembering: a plain "make every yellow pixel transparent" pass destroys Coach Studdard's portrait, because the gold Klein Oak wall behind her is the same yellow as the slide. Filling only from the border keeps colour that is *enclosed by* the photograph. Even so, her photo touches the slide edge, so the final masks come from the circle geometry — identical on every page — rather than per-page detection.

**`bio` is the content and `bioAvailable` is the switch**, deliberately two fields. Turning the switch off hides a bio and shows "Bio coming soon" *without deleting the text*, which is what a coach asking for theirs to come down actually needs. `CoachProfile` renders the bio only when both are present.

**`CoachCard` still exists and is unchanged.** Program Administration has names and titles and nothing else, so it keeps the compact monogram card; the coaches collection previews as `coachProfile` in `/admin` and administration as `coach`. Two preview types rather than one component trying to be both.

### The announcements section

The three cards under **Announcements** on the home page, the dialog behind each one, and the archive of everything that has already happened. Content is `content/announcements.json`, which *is* an editable collection — unlike the gallery, `/admin` shows it.

**An announcement archives itself.** Each one may carry a `startDate` (`YYYY-MM-DD`, the real calendar date) and optionally an `endDate`; the day after the last of those passes, it leaves the cards and joins the archive. Nobody has to remember to take down a Spirit Night on the morning after it ran, and no count anywhere is hand-maintained.

That rule cannot cover everything, so there are two ways into the archive and each exists for a reason:

- **Dated** — `startDate` in the past. Automatic.
- **Undated** — no `startDate` at all, plus `archived: true` when it is time. A standing pantry drive with a drop-off location has no last day, and inventing one would put a real claim on the page that nobody made. An undated announcement therefore stays current **forever** until somebody ticks the box. That is the safe direction to fail: it is visible and can be taken down, rather than vanishing on a date nobody chose.

`splitAnnouncements()` in `src/data/announcements.ts` is the whole rule, and it is pure — which is what lets it run twice.

**The split is computed twice, exactly like Upcoming Events.** This is a static export, so what is baked into the HTML is only as fresh as the last build; `AnnouncementsBrowser` re-runs the same function in the browser against the real date, and again when the tab returns to the foreground. First render is the server's, so hydration matches and nothing flickers. See [Deployment](#deployment) for why the nightly rebuild is the other half of this.

**Flyers are a dialog, not the page.** A flyer is a poster the program hands over, stored as two WebPs in `public/images/announcements/` — a ~500px derivative cropped to a strip on the card, and a ~1000px one shown whole when the announcement is opened. Three reasons it is not simply rendered on the card at full size: the posters are tall and would swamp the section, they are ~200 KB each and only a reader who wants one should pay for it, and the two Spirit Night posters are *the same picture* down to the headline — which is why the card crop is centred rather than top-aligned, so the restaurant is what shows.

**The card carries the facts as text; the flyer repeats them.** Date, time, location and summary are real content in the JSON, not pixels in a poster. That is what makes the section searchable, translatable, and usable by a screen reader — and it is why `flyer.alt` is required to say everything the poster says rather than "Spirit Night flyer".

**It degrades in three separate places**, because a modal is the one thing that cannot work without JavaScript:

- The **flyer** is a real `<a>` to the full poster, and the dialog only intercepts the click — the same bargain `GalleryBrowser` makes with its lightbox. Modified clicks (new tab, save) are left alone.
- The **archive** renders as a `<details>` disclosure holding the same list, and only becomes a button once the page has hydrated. Hydration is detected with `useSyncExternalStore`, not an effect, so there is no cascading render.
- The **"Details" link is not rendered at all** until hydrated, and is skipped entirely when the dialog would only repeat the card back. A control that silently does nothing is worse than no control.

**`Modal` (`src/components/ui/Modal.tsx`) is the shared dialog** and follows the same rules as the gallery lightbox: focus moves in and is trapped, Escape closes, the backdrop closes but the panel does not, the page behind does not scroll, and focus returns to whatever opened it. It captures the opener itself rather than being passed one, so no caller can forget. It is deliberately **not** `<dialog showModal>` — the top layer and `::backdrop` stop matching the site's own tokens. `GalleryBrowser` still has its own copy of this behaviour and has not been migrated; see Known Limitations.

### The photo gallery

142 photos in five albums — Waller ISD Tournament, Varsity, Junior Varsity, Flex, Freshman — at `/gallery`, reached from the main menu and from the champion banner on the home page. (The count moves whenever a photo is added or taken down; the page reads it from the manifest, so only this sentence goes stale.)

**Adding photos is a script, not an edit.**

```bash
# drop a folder of JPEGs into content/images/<album-name>/, then:
node scripts/build-gallery.mjs
git add content/gallery.json public/images/gallery
```

The script walks `content/images/`, treats **any folder holding images as an album** (folders holding only folders are containers — the photographer's collection wrapper is one), and writes two WebPs per photo into `public/images/gallery/<album>/`: a ~600px `-thumb` for the grid and a ~1400px full for the lightbox. It rewrites `content/gallery.json` with paths and real pixel dimensions, so the page reserves the right space and nothing reflows as thumbnails arrive.

Things worth knowing before re-running it:

- **Re-running is cheap.** A derivative is only re-encoded when it is missing or older than its source, so adding one album does not re-process the rest of the library.
- **A new folder needs no code change.** `ALBUM_TITLES` maps a folder name to how it should read (`jv` → "Junior Varsity"); a folder with no entry gets a title derived from its name. `ALBUM_ORDER` fixes the display order and anything unlisted sorts to the end.
- **Loose files at the top of `content/images/` are skipped and reported**, not swept into a nameless album — the champion banner source sits there.
- **Files sort naturally** (`…9` before `…10`), so album order is stable across machines.
- **The source filename becomes a public URL, so it must not name a student.** The generator slugs `<file>.jpg` into `/images/gallery/<album>/<file>.webp` — a name is guessable and permanent even though the alt text deliberately names nobody. Photos that arrive from a phone or a parent named after the player get renamed to what is *in* the frame (`var-boots.png`, `var-college-flags.jpg`) before the script is run. The photographer's `A28A####.jpg` drops already satisfy this by accident.
- **The originals are gitignored.** `content/images/` is 41 MB of full-resolution JPEG that only this script reads; the 18 MB of derivatives is what ships. That also means **git is not a backup of the originals** — they exist only where they were dropped.

**Taking a photo down is the reverse, and the order matters.**

```bash
# 1. move the original OUT of the gallery source tree — do not delete it
mv content/images/<album>/<PHOTO>.jpg ~/Workspace/play/ko-volleyball-photos-removed/<album>/
# 2. delete both derivatives
rm public/images/gallery/<album>/<photo>.webp public/images/gallery/<album>/<photo>-thumb.webp
# 3. regenerate the manifest, then commit all three changes
node scripts/build-gallery.mjs
```

The generator rewrites `content/gallery.json` from what it finds on disk, so the photo disappears from the album and every count on the page — album totals, "Showing N photos", the page description — follows from the manifest and needs no editing.

**Move the original, do not `rm` it.** `content/images/` is gitignored, so the drop is the only copy that exists anywhere; a takedown request is about the *website*, and destroying the family's photograph is a separate decision nobody asked for. `~/Workspace/play/ko-volleyball-photos-removed/` holds the ones taken down so far, outside the repo so it cannot dirty a deploy.

Skipping step 2 leaves an orphaned derivative in `public/` — invisible on the page, but still downloadable at a guessable URL, which is not what "taken down" means to the person who asked.

**The page degrades instead of breaking.** Every thumbnail is a real `<a>` to the full-size WebP, so with JavaScript off the grid is still a browsable gallery — the browser's own image view replaces the lightbox. The album filter is a `<fieldset>` of radio inputs, the same pattern as `ScheduleBrowser`, and with JavaScript off every album shows rather than none. Thumbnails are lazy-loaded and a full-size image is fetched only when a lightbox opens, so a phone on school Wi-Fi downloads what is on screen and not 18 MB.

**The lightbox is a dialog and follows the dialog rules**: focus moves in and is trapped, Escape closes, arrow keys step through the *filtered* set (so "next" means what the eye expects), the page behind does not scroll, and focus returns to the thumbnail that opened it.

**Alt text says what is actually known.** Nobody has described these frames, so each photo announces its album and position — "Varsity — photo 12 of 42". It is honest rather than good: see Known Limitations.

**The hero logo is a prepared raster, and the preparation matters.** The mark is `public/images/brand/panther-logo.png`, derived from `logo-redesign/panther-black-high-res-with-words-01.png`. It cannot be an SVG: the artwork carries a soft gold glow that vector shapes will not reproduce.

The source ships as a 1024px square with a white frame and a `#0d0d0d` panel behind the art. Dropped onto the black hero unchanged, that panel reads as a faintly visible grey square. Three steps fix it, and any re-export of the logo needs the same treatment:

1. **Crop to the dark panel and inset past its rim.** The frame's edge is anti-aliased, so a bounding box alone leaves a 1–2px white line.
2. **Convert the black backing to real transparency.** The art is light-on-black, so luminance *is* opacity: subtract the panel's own black level, take `alpha = max(R,G,B)`, and un-premultiply (`RGB × 255 ÷ alpha`). The result composites back to the exact original on black while the glow becomes a genuine soft alpha halo. **Zero out RGB and alpha below ~10 first** — dividing a near-zero alpha manufactures bright white pixels, which is how an early attempt produced a light haze filling the whole logo box.
3. **Trim to the visible bounding box, then quantize to 256 colours.** Quantising is only safe *after* step 2's cutoff; done before it, the palette rounds those invisible white pixels up to visible opacity. Final asset: 695×646, ~74 KB.

Because the background is genuinely transparent, the logo sits correctly on any dark surface, not just the exact hero colour. It is not editable through `/admin` — this is brand identity, not content.

**The gold is two tokens, and which one you use depends on the background.** `--color-accent` (`#f5b317`) is the logo yellow and is for dark surfaces only: it hits 11.3:1 on black but just 1.9:1 on white, so it must never carry text on a light background. `--color-accent-strong` (`#8a6a0a`) is the same hue darkened until it clears 5.1:1 on white, and is what light-background text, links, and icons use. Every `text-accent` in the codebase currently sits on `bg-primary`, `bg-black`, or a dark card; light surfaces use `text-accent-strong`. Preserve that split when adding anything gold.

---

## 🟡⚫️ Deployment path — engineering to prod

Three repositories, three roles. Only one of them is where work happens; the other two are build targets that must never be edited directly.

| | Repository | Branch | What it is | Serves |
|---|---|---|---|---|
| **Source** | [alfredsilvertonai/ko-volleyball-web](https://github.com/alfredsilvertonai/ko-volleyball-web) | `main` | Where all work happens. Full history, all branches, all internal docs. **No GitHub Pages site** — it is not an environment. | nothing |
| **Staging** | [thecodinci/thecodinci.github.io](https://github.com/thecodinci/thecodinci.github.io/tree/main/kovb) — the `kovb/` folder | `main` | Hand-deployed **built output only**. No source, no CI. A folder inside a larger personal site. | <https://codinci.com/kovb/> |
| **Production** | [kleinoak/kleinoak.github.io](https://github.com/kleinoak/kleinoak.github.io) | `main` | A mirror of `main` with the internal docs stripped. GitHub Actions builds and deploys it. | <https://kleinoakvolleyball.com> |

Production is on the program's real domain with HTTPS enforced. `kleinoak.github.io` and `www.kleinoakvolleyball.com` both **301 to the apex**, so there is one canonical address. The custom domain lives in the repository's Pages settings.

**Every environment is `main`, and each `main` means something different.** Pages on production is configured `source: { branch: "main", path: "/" }` with `build_type: workflow`; staging serves `main` at `/` and the site lives in a sub-folder of it. Nothing is deployed from a `release` or `gh-pages` branch, and no branch name distinguishes the environments — the *repository* does. What writes to each:

| Branch | Written by | Never do this |
|---|---|---|
| `origin/main` | Merged pull requests, and direct `/admin` publishes | — |
| `prod/main` | `scripts/deploy-prod.sh` only, as a **force-push** of a freshly built docs-stripped commit | Commit to it directly; the next deploy discards the work |
| `thecodinci/main` | A hand `rsync` of `out/` into `kovb/`, then an ordinary commit | Put source there; staging carries built output only |

**There is no dev site.** The source repository has GitHub Pages *off* — `GET /repos/alfredsilvertonai/ko-volleyball-web/pages` returns 404 — which is why `deploy.yml` gates its Pages steps to the production repository (see [Deployment](#deployment)). `npm run dev` is the development environment; staging is the first place a change is visible to anyone else.

⚠️ **`kleinoak/kleinoak.github.io` also carries a `production` branch. It is not production.** It was last written on 2026-08-13 (`9b0b6e0`, "Merge pull request #1 from kleinoak/main") and has since **diverged** from `main` — it is not an ancestor, nothing writes to it, and Pages does not read it. The name is the whole problem: it reads as authoritative when `main` is. Confirm before trusting either:

```bash
gh api repos/kleinoak/kleinoak.github.io/pages -q .source   # {"branch":"main","path":"/"}
```

**Staging drifts, and nothing stops it.** Production is one command and a CI run; staging is a manual `rsync` with two steps that are easy to miss, and there is no `deploy-staging.sh` — `scripts/` holds only `build-gallery.mjs`, `deploy-prod.sh` and `validate-content.mts`. On 2026-09-05, immediately after a production deploy, staging was still serving the August announcements and 138 gallery photos: roughly three weeks and two releases behind. **Check it before showing it to anyone**, because "staging" implies a freshness it does not have:

```bash
curl -s https://codinci.com/kovb/gallery/ | grep -o '[0-9]* photos' | head -1
```

---

### The path a change takes

```
  work on a branch off main
        │
        ▼
  PR into alfredsilvertonai/ko-volleyball-web   ← pull-request.yml: validate, lint, typecheck, build
        │
        ▼
  squash merge to main                          ← the only thing that lands on main
        │
        ├─────────────────────────────►  sh scripts/deploy-prod.sh
        │                                 force-pushes main-minus-docs to prod/main
        │                                 → deploy.yml builds and deploys
        │                                 → https://kleinoakvolleyball.com
        │
        └─────────────────────────────►  build with NEXT_PUBLIC_BASE_PATH=/kovb
                                          rsync into thecodinci.github.io/kovb/
                                          commit + push there
                                          → https://codinci.com/kovb/
```

**Branches.** `YYYYMMDD/<kind>/<slug>` — for example `20260817/feature/varsity-results`, `20260814/fix/hero-centering`, `20260815/docs/refresh-documentation`. One PR each, **squash merged**, branch deleted after. `main` is never committed to directly.

---

### Deploying to production

```bash
sh scripts/deploy-prod.sh
```

That is the whole command, and it is the **only** supported route. It refuses to run on a dirty working tree or when `main` and `origin/main` disagree, so what ships is always what was reviewed and merged.

What it does: builds a tree from `main` with every tracked `*.md` except `README.md` removed, and force-pushes it to `prod/main`. `deploy.yml` then validates content, builds, writes `.nojekyll`, and deploys to Pages.

**Consequences to understand:**

- **Production history is rewritten on every deploy.** It is a deployment artefact; `origin` is the source of truth. `prod/main` will not match `origin/main` — that is expected, not drift.
- **Never `git push prod main`.** It would restore the internal docs and conflict with the rewritten history.
- **Never commit in the production repo.** The next deploy discards it.
- The `prod` remote is `git@github.com-kleinoak:kleinoak/kleinoak.github.io.git`, which needs the `github.com-kleinoak` SSH alias (see `~/Workspace/INSTRUCTIONS.md`).

---

### Deploying to staging

Staging carries **built output only** — no source ever goes there. It is a sub-path deploy, which is the part that goes wrong if rushed:

```bash
rm -rf out .next
NEXT_PUBLIC_BASE_PATH=/kovb npm run build     # required: served from /kovb, not the root
touch out/.nojekyll                            # required: see below
rsync -a --delete --dry-run out/ ~/Workspace/volunteer/thecodinci.github.io/kovb/
rsync -a --delete        out/ ~/Workspace/volunteer/thecodinci.github.io/kovb/
cd ~/Workspace/volunteer/thecodinci.github.io && git add kovb && git commit && git push
```

- **`NEXT_PUBLIC_BASE_PATH=/kovb` is not optional.** Without it every asset resolves against the domain root and the page loads unstyled.
- **`.nojekyll` must be recreated before each sync.** It exists in `kovb/` but *not* in the source repo's `public/`, so `rsync --delete` removes it — and without it Pages runs Jekyll, which ignores `_next/` and 404s every script and stylesheet.
- **Always dry-run first.** `--delete` removes anything in `kovb/` not in `out/`. Stale build-hash folders under `_next/static/` are expected; anything else is not.
- Set **no** analytics ID here — see below.

---

### What differs between the environments

| | Production | Staging |
|---|---|---|
| `SITE_BASE_PATH` / `NEXT_PUBLIC_BASE_PATH` | **unset** — served from the domain root | `/kovb` |
| `GA_MEASUREMENT_ID` | set as a repository variable | **unset**, deliberately |
| Analytics | active | none emitted at all |
| Built by | GitHub Actions | by hand, locally |
| Rebuilt nightly | yes, 06:00 Central | no — only when someone deploys |
| Internal `.md` | stripped, `README.md` only | n/a, no source present |

The analytics split is by construction rather than by filter: with no ID the tag is not rendered, so staging cannot pollute production's reports even by accident.

---

### After deploying

Production takes a minute or two; check the Actions tab, then the live site. Worth verifying on a change that touches assets or paths:

```bash
grep -c '"/_next/' out/index.html        # 0 — every asset must carry the base path
grep -c 'googletagmanager' out/index.html # 0 on staging, 1 on production
```

**`gh` cannot see either mirror by default.** It authenticates over HTTPS with its own token and ignores the SSH aliases entirely, so `gh` commands against `kleinoak/…` fail with "Could not resolve to a Repository" even though `git` works fine. `gh auth status` first. Production repository settings — variables, Pages, collaborators — have to be changed in the browser signed in as `kleinoak`.

---

### Known fragility

- **The custom domain is configured in Pages settings, not by a `CNAME` file in the tree.** `deploy-prod.sh` force-pushes a tree built from `main`, which has no `CNAME`; if one is ever added to the production repo by the GitHub UI, the next deploy would remove it. It has survived every deploy so far because the setting is what Pages honours for an Actions-built site — but a sudden loss of the custom domain after a deploy would have this as its first suspect.
- **Staging drifts silently.** Nothing rebuilds it, so it is only as current as the last manual deploy. It is not a preview of `main`; it is a snapshot of whenever someone last ran the commands.
- **Two repositories can accept `/admin` publishes.** An editor publishing from a production build writes to the production repo, and content there would then be overwritten by the next `deploy-prod.sh` run, which builds from `main`. This is the single most likely way to lose content, and it has not been resolved.

---

## Deployment

The site is a static export deployed to GitHub Pages by `deploy.yml` on every push to `main` (which includes every direct publish from `/admin`).

**One-time setup on a fresh repository:**
1. **Settings → Pages → Source: GitHub Actions.**
2. If serving from a project sub-path (`https://<user>.github.io/ko-volleyball-web`), add a repository **variable** `SITE_BASE_PATH` = `/ko-volleyball-web`. **Production leaves it unset** — it is served from the root of `kleinoakvolleyball.com`, and setting it would break every asset path.
3. Invite editors as collaborators with **Write** access.

`concurrency: { group: pages, cancel-in-progress: true }` ensures two publishes in quick succession never deploy over each other — the newest always wins. `touch out/.nojekyll` stops GitHub Pages from running Jekyll over the export.

**The Pages steps are gated to the production repository, and the rest of the workflow is not.** `deploy.yml` lives in the source tree, so it travels to the engineering repo as well — where Pages is *off*, and `actions/configure-pages` fails with `Get Pages site failed … Not Found`. That failed on every push and every nightly run and had never once been green, so a red X on engineering carried no information: a genuine build break looked exactly the same. `configure-pages`, `upload-pages-artifact` and the whole `deploy` job now carry `if: github.repository == 'kleinoak/kleinoak.github.io'`.

Everything above the gate — `npm ci`, `validate:content`, `next build`, `.nojekyll` — still runs in both repositories, which is the point: **engineering keeps real CI**, and a broken content file is caught there rather than at the next hand-deploy. The nightly cron in engineering therefore deploys nothing and serves as a canary instead. Enabling Pages on the engineering repo would also have silenced the failure, but it would have published a second public copy of the site — photographs of students included — at a URL nobody asked for.

**Production is published by `scripts/deploy-prod.sh`, not by `git push`** — see [Deployment path — engineering to prod](#-deployment-path--engineering-to-prod) above for the repositories, the commands, and what must not be done to the mirrors.

**Dated content is filtered twice: once at build, once in the browser.** The home page's "Upcoming Events" is filtered against today's date, and in a static export "today" is frozen at build time. Two mechanisms are needed, not one:

1. **A nightly rebuild.** `deploy.yml` runs on `schedule: "0 11 * * *"` (06:00 Central) as well as on push, refreshing the prerendered HTML — which is what a crawler and a reader with JavaScript disabled get.
2. **`UpcomingEventsList` re-runs the same pure filter in the browser** (`upcomingFrom` in `src/data/calendar.ts`), against the real current date and again when the tab returns to the foreground. Its initial state is the server's list, so hydration matches and nothing flickers when the build is current.

The rebuild alone was not enough: between midnight and 06:00 the page still advertised fixtures already played — on 2026-08-17 a tournament that finished on the 16th sat at the top of the list. The date is computed in the program's timezone either way, so a reader in another state sees the schedule relative to Klein Oak's day rather than their own.

Two things to know about it: GitHub **disables scheduled workflows on a public repo after 60 days of inactivity** (it emails first), so an off-season gap may need the schedule re-enabling from the Actions tab; and the hand-deployed staging copy at `codinci.com/kovb/` never runs CI, so its list is only as fresh as its last manual deploy.

---

## For Editors (the volunteer-facing summary)

1. Ask the site administrator to invite you to the repository as a collaborator with Write access.
2. Go to `/admin` on the website.
3. Follow the on-screen steps to create a GitHub fine-grained token for this repository with **Contents: Read and write** (about two minutes, one time). Paste it in.
4. Pick a section in the sidebar, edit the fields. A live preview shows the real card as it will appear.
5. Open **Publish**, read the summary of exactly what you changed, and choose **Publish to the website** or **Ask for review first**.
6. The website updates itself a couple of minutes later.

Unpublished work stays in your browser, so you can close the tab and come back to it. If someone else publishes while you are editing, the editor tells you your draft is out of date rather than letting you overwrite their work.

**You do not have to delete an announcement when its event is over.** Give it a **Sort date** (`2026-10-01`) and the day after that passes it moves itself into the archive on the home page, where it stays readable. The only ones that need a hand are the ones with no date at all — a donation drive, say — and those have an **Archived** switch instead.

---

## Known Limitations

- **The editor has never been exercised against live GitHub.** Sign-in, edit, and publish have not yet been run end-to-end in a browser against a real repository (see PROJECT-LOG). Everything below the browser — schema, validation, diffing, build, static export — is verified.
- **The footer carries a build credit** linking to `codinci.com/about`. It is hardcoded in `Footer.tsx` rather than living in `content/`, since it is a developer credit the Booster Club does not maintain. Two deliberate choices are recorded there in comments: it is `text-white/45` because the quieter `white/35` measures 3.17:1 against the footer and fails the 4.5:1 WCAG AA floor, and it has no `target="_blank"` because a link that opens a new window ought to say so and the warning would be louder than the credit. Its 16px tap target is under WCAG 2.5.8's 24px — a knowing exception for a footer credit, not an oversight.
- **Rosters and the season schedule were transcribed by hand from the program's previous website**, which lived at `kleinoakvolleyball.com` until this site took that domain over. **That reference no longer exists** — the domain now serves this site, so "check it against kleinoakvolleyball.com" is now circular and cannot verify anything. The remaining external source of truth is **Rank One** (schedule, times, and results for whichever levels publish them — varsity and JV so far); rosters have no external source at all and can only be confirmed by the program. Re-check them when the season turns over and clear `roster` when it ends. No jersey numbers, player photos, or statistics are modeled, because none were published.
- **Rank One remains the live source of truth** for schedule changes; the schedule page links to it prominently rather than claiming to be authoritative, and states the date it was last checked.
- **The schedule is still a hand-made copy in the ways that matter.** A job now re-reads all four Rank One calendars three times a day (see [Keeping the schedule in sync](#keeping-the-schedule-in-sync)), which covers venues, maps, per-game notes and newly posted scores. It does **not** cover the parts that need judgement: start times in `matches.json` are still transcribed by hand, nothing warns when Rank One changes one, tournament records are still totted up by a person, and nothing notices a fixture that was played and never scored. The two dates on the schedule page say which half is which.
- **The sync is a scraper, and Rank One owes it nothing.** It reads `id="rpt_Games_*"` spans out of an ASP.NET page; a redesign upstream breaks it. The failure mode is deliberately loud — each level must parse a minimum number of games or the run fails without writing — so the site keeps the last good data rather than silently emptying, but nobody is paged when that happens. Watch the workflow, not the page.
- **Production is as fresh as the last deploy, not as the last sync.** The job commits to the source repository because a commit inside the production mirror is destroyed by the next `deploy-prod.sh` force-push. Until one of the two options in that section is done, a synced result reaches parents when somebody runs the deploy.
- **Changing a team's `slug`** breaks shared links and requires a developer to update the header menu; the field's help text says so, but nothing enforces it.
- **Staged images are capped by browser storage** (~5 MB for `localStorage`). Beyond that the editor keeps them in memory for the tab only and says so.
- **Coach bios are published; player bios and photos are still gated.** `bioAvailable` and the optional `photo` remain the switches, and for coaches both are now on — the program supplied the text and each coach's chosen portrait. Nothing equivalent exists for players, and `teams.json` still models no player photos, jersey numbers or statistics.
- **Two coach portraits include family, one of them children.** They are the photographs the coaches themselves picked for the program's "Meet The Coaches" deck, and the bios name family members, so this is the program's material and the coaches' choice rather than an editorial decision made here. It is still worth knowing that a slide shown at a parents' evening and a page on the open web are not the same audience. Alt text describes the group without naming any child. Removing one is a single field: clear `photo` on that coach, or switch `bioAvailable` off to pull the text too.
- **`content/` is the only editable surface.** Page structure, navigation, and copy outside the schema still require a developer.
- **Analytics are opt-in per environment.** GA4 is rendered only when `NEXT_PUBLIC_GA_ID` is set at build time, which is how development and the hand-deployed staging copy report nothing — there is no filter to maintain. Production reads it from the `GA_MEASUREMENT_ID` repository variable via `deploy.yml`. Two things are easy to get wrong: the env var must appear as the literal `process.env.NEXT_PUBLIC_GA_ID` (Next inlines it by textual substitution), and `<GoogleAnalytics>` does **not** track client-side navigation — `src/components/analytics/PageViews.tsx` sends `page_view` on route change, so GA4's Enhanced measurement "page changes based on browser history events" must stay **off** or every internal navigation is counted twice. See `GOOGLE-ANALYTICS-SETUP.md`.
- **Hero banners are code, not content.** The home page rotates between the program hero, the VBIF campaign banner and the Waller ISD champion banner (`HeroCarousel`, `CampaignBanner`, `ChampionBanner`); the slide list lives in `src/app/(site)/page.tsx`, so adding or removing a banner needs a developer. Two design constraints are load-bearing and should survive any change: only the **active slide is mounted** — hiding inactive slides with CSS leaves their links focusable, which is the standard carousel accessibility bug — and the **first slide is server-rendered**, so it is what appears on load and the only one that renders without JavaScript. The carousel also holds the tallest slide's height via a `ResizeObserver`, because the slides differ by 81px at desktop and 407px on a phone and the page would otherwise jump on every rotation.
- **The VBIF banner has no destination and no real accessible name.** Its alt text is just `"VBIF"`, and the artwork is an image of text, so the wordmark neither scales with the reader's font size nor is available to a screen reader (WCAG 1.4.5). The champion banner is the same kind of artwork handled the other way — its alt text carries the banner's own words and the whole banner links to `/gallery` — which is the pattern to copy if VBIF is ever revisited. Both remain images of text and would be better as real markup over a background.
- **Two deployment hazards, both documented in [Deployment path](#-deployment-path--engineering-to-prod) and neither fixed.** `kleinoak/kleinoak.github.io` carries a diverged `production` branch that is *not* what Pages serves — `main` is — and the name invites exactly the wrong assumption. And staging has no deploy script, so it drifts silently: on 2026-09-05 it was two releases behind minutes after a production deploy. A `deploy-staging.sh` and deleting that branch are both small, separate changes.
- **The dialog behaviour exists twice.** `Modal` was extracted for the announcements section, but `GalleryBrowser` still carries its own focus trap, Escape handler and scroll lock, written before it. They agree today; nothing makes them stay that way. Migrating the lightbox is a contained change that was deliberately not bundled with a content update.
- **The pantry drive has no date, because its flyer has none.** It reads "Ongoing" and never auto-archives — somebody has to tick Archived when it ends. Its Amazon wish list is a QR code in the poster and the URL behind it could not be recovered from the image, so the site cannot link it; a reader has to open the flyer and scan. Both are fixable the moment the program supplies the dates and the link.
- **Two of the three flyers are photographs of a screen.** They were rotated, de-bezelled and re-encoded, but the moiré and the glare are in the source and no processing removes them. The pantry flyer is a 345px-wide PNG, so its "full" size in the dialog is the same file as its thumbnail and it is soft on a large display. Replacing all three with the original digital artwork is a straight swap of two files each.
- **Gallery alt text is honest, not descriptive.** Each photo announces its album and position ("Junior Varsity — photo 7 of 32") because nobody has described the frames. That is better than `IMG_2604` and better than inventing what is happening, but a screen-reader user still cannot tell a huddle from a serve. Real alt text needs someone who was at the matches; it is `photoAlt()` in `src/data/gallery.ts` and touching one function fixes every caller.
- **The gallery is not editable, and removing a photo is a developer job.** It is generated, so `/admin` cannot show it: taking a photo down means deleting its source and both derivatives and re-running `scripts/build-gallery.mjs`. Worth knowing in advance, because *"please take that one of my daughter down"* is a request that arrives on a weekend. These are photographs of minors on a public site — whether each one may be published is the program's call, not the code's, and nothing here records who consented.
- **The photo originals live in exactly one place.** `content/images/` is gitignored (41 MB that only the generator reads), so the repository is not a backup of them. If the folder is lost, the ~1400px derivatives are all that remain.
- **Bitmap assets must be compressed before they are committed.** `images.unoptimized` is on (GitHub Pages cannot run Next's optimiser), so **whatever is in `public/` is byte-for-byte what visitors download** — there is no build step that will save you. The VBIF banner arrived as a 1,096 KB PNG and ships as a 34 KB WebP, visually identical. Photographic artwork belongs in WebP; PNG only for flat-colour graphics that need transparency. `sharp` is already available via Next, so `sharp(src).webp({ quality: 80 })` is enough. Keep the source file in `logo-redesign/`, which is not served.
- **No scheduled publishing, no drafts shared between editors, no rollback UI.** Rollback is `git revert` by a developer. These were judged unnecessary for the program's actual workflow.
