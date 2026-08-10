# KLEIN OAK VOLLEYBALL — Project Documentation

**The Klein Oak Panther Volleyball website and its database-free content editor**

---

## Overview

`ko-volleyball-web` is the modernized website for the Klein Oak High School Panther Volleyball program: teams, key dates, match schedule, coaches, sponsors, parent resources, and contact information. It is a Next.js App Router site exported as fully static HTML and served by GitHub Pages.

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
| Announcements | list | `content/announcements.json` | Home page |
| Key dates | list | `content/events.json` | Home page, Schedule |
| Teams | list | `content/teams.json` | Home, Teams, team detail pages |
| Match schedule | list | `content/matches.json` | Schedule |
| Coaches | list | `content/coaches.json` | Coaches |
| Program administration | list | `content/administration.json` | Coaches |
| Parent resources | list | `content/resources.json` | Resources |
| Booster Club board | list | `content/booster-board.json` | Contact |
| Sponsor tiers | list | `content/sponsor-tiers.json` | Home page, Sponsors |
| How to sponsor | singleton | `content/sponsor-steps.json` | Sponsors |
| Site settings | singleton | `content/site.json` | Every page |

**Field types**: `text`, `textarea`, `slug`, `url`, `email`, `link`, `select`, `boolean`, `number`, `stringList`, `image`. Fields carry `required`, `maxLength`, `help`, `placeholder`, `options`, and `deriveFrom` (a slug generated from another field when left blank). Dotted names address nested keys (`socials.facebook`).

**Collection metadata** that drives the editor UI: `group` (sidebar grouping), `description` and `usedOn` (so an editor knows where a change will show up), `labelField` (row titles), `identifierField` (uniqueness, and how items are matched when diffing), `itemNoun` ("Add announcement"), and `preview` (which real site card to render live beside the form).

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
├── content/                        # THE CONTENT STORE (11 JSON files)
│   ├── site.json  announcements.json  events.json  teams.json
│   ├── coaches.json  administration.json  matches.json  resources.json
│   └── booster-board.json  sponsor-tiers.json  sponsor-steps.json
├── scripts/
│   └── validate-content.mts        # prebuild + CI content gate
├── src/
│   ├── app/
│   │   ├── layout.tsx              # html/body, fonts — no header/footer
│   │   ├── (site)/                 # PUBLIC SITE — header + footer live here
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Home
│   │   │   ├── teams/  teams/[slug]/  coaches/  schedule/
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
│   ├── components/                 # site header, footer, cards, home sections
│   └── data/                       # thin typed loaders over content/*.json
├── logo-redesign/                  # brand exploration — logo options + source renders
├── public/
│   ├── images/brand/               # prepared logo art (hero lockup)
│   ├── images/uploads/             # photos committed by the editor
│   └── robots.txt                  # disallows /admin
├── .github/workflows/
│   ├── deploy.yml                  # push to main → validate, build, Pages
│   └── pull-request.yml            # PR → validate, lint, typecheck, build
├── next.config.ts                  # output: "export", basePath, unoptimized images
├── .env.example
├── IDLC.md                         # the originating brief and constraints
├── WEBSITE_EVALUATION.md           # evaluation of the original public site
└── IMPLEMENTATION_SUMMARY.md       # the 2026-08-02 prototype build report
```

**Why the `(site)` route group.** The public header and footer moved out of the root layout into `(site)/layout.tsx` so `/admin` can render as its own full-screen application without the program's navigation wrapped around it. URLs are unchanged — route groups do not appear in paths.

**Every image `src` must go through `assetPath()` (`src/lib/asset.ts`).** `next/image` does not rewrite `src` when the image is `unoptimized` — which it always is here, because Pages cannot run Next's optimizer. A bare `/images/…` src therefore resolves against the *domain* root and 404s whenever the site is served from a sub-path: a GitHub Pages project site, or a folder inside another Pages repo. `assetPath()` prefixes `NEXT_PUBLIC_BASE_PATH`. This applies equally to literal paths in components and to paths coming out of `content/*.json`. Nothing in the build catches a missed call, so the check is `grep` the export for `src="/` paths that lack the base path.

**The hero logo is a prepared raster, and the preparation matters.** The mark is `public/images/brand/panther-logo.png`, derived from `logo-redesign/panther-black-high-res-with-words-01.png`. It cannot be an SVG: the artwork carries a soft gold glow that vector shapes will not reproduce.

The source ships as a 1024px square with a white frame and a `#0d0d0d` panel behind the art. Dropped onto the black hero unchanged, that panel reads as a faintly visible grey square. Three steps fix it, and any re-export of the logo needs the same treatment:

1. **Crop to the dark panel and inset past its rim.** The frame's edge is anti-aliased, so a bounding box alone leaves a 1–2px white line.
2. **Convert the black backing to real transparency.** The art is light-on-black, so luminance *is* opacity: subtract the panel's own black level, take `alpha = max(R,G,B)`, and un-premultiply (`RGB × 255 ÷ alpha`). The result composites back to the exact original on black while the glow becomes a genuine soft alpha halo. **Zero out RGB and alpha below ~10 first** — dividing a near-zero alpha manufactures bright white pixels, which is how an early attempt produced a light haze filling the whole logo box.
3. **Trim to the visible bounding box, then quantize to 256 colours.** Quantising is only safe *after* step 2's cutoff; done before it, the palette rounds those invisible white pixels up to visible opacity. Final asset: 695×646, ~74 KB.

Because the background is genuinely transparent, the logo sits correctly on any dark surface, not just the exact hero colour. It is not editable through `/admin` — this is brand identity, not content.

**The gold is two tokens, and which one you use depends on the background.** `--color-accent` (`#f5b317`) is the logo yellow and is for dark surfaces only: it hits 11.3:1 on black but just 1.9:1 on white, so it must never carry text on a light background. `--color-accent-strong` (`#8a6a0a`) is the same hue darkened until it clears 5.1:1 on white, and is what light-background text, links, and icons use. Every `text-accent` in the codebase currently sits on `bg-primary`, `bg-black`, or a dark card; light surfaces use `text-accent-strong`. Preserve that split when adding anything gold.

---

## Deployment

The site is a static export deployed to GitHub Pages by `deploy.yml` on every push to `main` (which includes every direct publish from `/admin`).

**One-time setup on a fresh repository:**
1. **Settings → Pages → Source: GitHub Actions.**
2. If serving from a project sub-path (`https://<user>.github.io/ko-volleyball-web`), add a repository **variable** `SITE_BASE_PATH` = `/ko-volleyball-web`. Leave it unset for a custom domain such as `kleinoakvolleyball.com`.
3. Invite editors as collaborators with **Write** access.

`concurrency: { group: pages, cancel-in-progress: true }` ensures two publishes in quick succession never deploy over each other — the newest always wins. `touch out/.nojekyll` stops GitHub Pages from running Jekyll over the export.

---

## For Editors (the volunteer-facing summary)

1. Ask the site administrator to invite you to the repository as a collaborator with Write access.
2. Go to `/admin` on the website.
3. Follow the on-screen steps to create a GitHub fine-grained token for this repository with **Contents: Read and write** (about two minutes, one time). Paste it in.
4. Pick a section in the sidebar, edit the fields. A live preview shows the real card as it will appear.
5. Open **Publish**, read the summary of exactly what you changed, and choose **Publish to the website** or **Ask for review first**.
6. The website updates itself a couple of minutes later.

Unpublished work stays in your browser, so you can close the tab and come back to it. If someone else publishes while you are editing, the editor tells you your draft is out of date rather than letting you overwrite their work.

---

## Known Limitations

- **The editor has never been exercised against live GitHub.** Sign-in, edit, and publish have not yet been run end-to-end in a browser against a real repository (see PROJECT-LOG). Everything below the browser — schema, validation, diffing, build, static export — is verified.
- **Rosters and the season schedule mirror what the program publishes** at kleinoakvolleyball.com. They are student names and a spreadsheet transcribed by hand — re-check them against the program's own page when the season turns over, and clear `roster` when it ends. No jersey numbers, player photos, or statistics are modeled, because the program does not publish any.
- **Rank One remains the live source of truth** for schedule changes; the schedule page links to it prominently rather than claiming to be authoritative.
- **Changing a team's `slug`** breaks shared links and requires a developer to update the header menu; the field's help text says so, but nothing enforces it.
- **Staged images are capped by browser storage** (~5 MB for `localStorage`). Beyond that the editor keeps them in memory for the tab only and says so.
- **Bios and photos** are gated behind flags (`bioAvailable`, optional `photo`) because no authoritative content or publication permissions were available at build time.
- **`content/` is the only editable surface.** Page structure, navigation, and copy outside the schema still require a developer.
- **No scheduled publishing, no drafts shared between editors, no rollback UI.** Rollback is `git revert` by a developer. These were judged unnecessary for the program's actual workflow.
