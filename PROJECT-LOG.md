# PROJECT.log

## 20260802

### Decisions
- Rebuilt the Klein Oak Panther Volleyball site as a **local modernization prototype** in `ko-volleyball-web`, per `IDLC.md`: the live public site must not be touched, nothing deployed, no pull requests.
- Kept the scaffold's stack — **Next.js 16 App Router + TypeScript (strict) + Tailwind CSS v4** — rather than introducing a new one.
- **No CMS and no backend at this stage.** Content lives in typed TypeScript modules under `src/data/`.
- **Fabricate nothing.** Where the original site had no authoritative content (rosters, player photos, coach bios, match schedules), render deliberate empty states rather than invent data. Where wording is prototype copy, flag it.
- New information architecture: Home / Teams / Coaches / Schedule / Camps & Tryouts / Resources / Sponsors / Contact, replacing the old Booster Club/Sponsorships nesting.

### Accomplishments
- [x] Evaluated the existing public site and wrote `WEBSITE_EVALUATION.md` (content, UX, UI findings).
- [x] Built the full page set: home, teams index, per-team pages via `generateStaticParams` (Varsity / Junior Varsity / Freshman), schedule, camps & tryouts, coaches, resources, sponsors, contact, 404.
- [x] Design system: Panther black/gold token palette in `@theme inline`, Oswald display type over Geist Sans, consistent card/button/spacing patterns.
- [x] Layout and UI components: `Header` (desktop dropdown on native `<details>`, accessible mobile menu), `Footer`, `PageHero`, `Container`, `Button`, `SectionHeading`, `Badge`, `EmptyState`, six card types, eight home-page sections.
- [x] Content modules in `src/data/`: site, announcements, events, camps, teams, coaches, resources, sponsors.
- [x] Dedicated **Camps & Tryouts** and **Resources** hubs consolidating links previously scattered across the homepage, schedule page, and external Rank One links.
- [x] Accessibility pass: skip link, semantic landmarks, one `h1` per page, `:focus-visible` outline, `prefers-reduced-motion`, `aria-hidden` on decorative icons, labeled interactive icons, no information conveyed by color alone.
- [x] Responsive validation at 320 / 375 / 390 / 768 / 1024 / 1280 / 1440px; the one wide table (camp pricing) scrolls inside its own container rather than the page.
- [x] Wrote `IMPLEMENTATION_SUMMARY.md`. Committed locally; nothing pushed, no PR opened.

---

## 20260807

### Decisions
- **New requirement (IDLC.md, 20260807):** the program has **no budget** for a conventional web app with a hosted CMS. Keep the current layout as built; add content management on top of it. It must run on **GitHub Pages with no database**, and be usable by parents and volunteers who have GitHub accounts and are invited as collaborators.
- **The repository is the database.** `content/*.json` files are the tables, git is the transaction log, GitHub is the API. This is the only design that satisfies "no database, no server, no monthly bill" without giving up history or review.
- **The CMS has no backend of its own.** `/admin` is a statically exported React app that calls `api.github.com` directly from the editor's browser with the editor's own token. Rejected alternatives: a serverless function (needs a host and a secret), a GitHub OAuth App (needs a server to exchange the code), Decap/Netlify CMS (needs their auth backend).
- **Identity is the editor's GitHub account; authorization is repository collaborator access.** No accounts, no passwords, no user table, no role system to keep in sync. Revoking write access revokes publishing.
- **Fine-grained personal access token, not OAuth.** It is the only browser-only option that keeps least privilege intact: scoped to this repository, `Contents: Read and write`, nothing else. Cost is a one-time ~2-minute setup, so the sign-in screen walks the editor through it.
- **One publish = one commit**, written through the Git Data API (blob → tree → commit → ref) rather than several Contents-API calls. One review, one build, one deploy. The ref update is a **non-forced** fast-forward, so a concurrent publish is rejected instead of silently overwriting someone's work.
- **Two publish modes**, chosen by the editor: publish straight to `main`, or open a pull request. Direct publishing is the default because the group is small and trusted; the PR path exists for anyone who wants a second pair of eyes, and is already compatible with a branch-protection rule if the program later wants review enforced.
- **One schema, three consumers.** `src/cms/schema.ts` drives the admin forms, the change summaries, and the CI validator. Adding a field must not mean editing five files.
- **Validation runs in CI too, not only in the browser** — a hand-edited JSON file or a stale draft must never be able to take the live site down.
- **Resize images in the browser before committing.** The repo is the media store; unresized phone photos would ruin the git history.

### Accomplishments — Static export and content extraction
- [x] `next.config.ts` → `output: "export"`, `trailingSlash: true`, `images.unoptimized` (Pages cannot run Next's optimizer), optional `NEXT_PUBLIC_BASE_PATH` for project-site sub-paths.
- [x] Extracted all site content out of TypeScript into **12 JSON files** under `content/`: site, announcements, events, camps, tryouts, tryout-milestones, teams, coaches, resources, booster-board, sponsor-tiers, sponsor-steps.
- [x] Reduced `src/data/*.ts` to thin typed loaders over that JSON (−274 lines); page components were not changed. Added the `@content/*` tsconfig path alias and `allowImportingTsExtensions`.
- [x] Moved the public pages into a `(site)` route group with its own layout holding the header and footer, so `/admin` can render full-screen. Public URLs unchanged.

### Accomplishments — The CMS (`src/cms`, ~3,700 lines)
- [x] `schema.ts` — the content model: 12 collections, 11 field types, per-collection `group`/`description`/`usedOn`/`labelField`/`identifierField`/`itemNoun`/`preview`. Dependency-free so Node can import it directly.
- [x] `github.ts` — the only backend. `getUser`, `getRepo`, `readFile(s)`, `commitFiles` (blob → tree → commit → non-forced ref PATCH), `createBranch`, `createPullRequest`, `listRecentCommits`, `canPublish`. Typed `GitHubError` carrying status and docs URL.
- [x] `CmsProvider.tsx` — all editor state: sign-in, baseline-vs-draft per collection with blob SHAs, stale-draft detection, live validation, change summaries, both publish modes, and GitHub errors translated into plain English (401 → "check the token wasn't truncated or expired"; 403 → "may be missing Contents: Read and write"; 409/422 → "someone else may have published — reload and try again").
- [x] `validation.ts` — shared rules: required fields, max lengths, slug/email/URL/link formats, uniqueness on `identifierField`, plus `normalize`/`serialize` so committed JSON is always canonically shaped and diff-friendly.
- [x] `changes.ts` — JSON diff rendered as something a volunteer can actually check: entries added, removed, reordered, and each changed field as `from → to`. Reused verbatim for the pull-request body.
- [x] `image.ts` — browser-side resize to a 1800px longest side before commit (≈6 MB → ≈300 KB), warning above ~1.5 MB, deterministic slugged filenames under `public/images/uploads/`.
- [x] `storage.ts` — token in `sessionStorage` by default and `localStorage` only on explicit "remember on this computer"; repo override; drafts stamped with the baseline SHA; staged media, with a graceful fall back to in-memory when the ~5 MB quota is hit.
- [x] Editor UI: `AdminApp` (shell, grouped sidebar, hash routing, overview with recent `content/` commits, unsaved-work warning on unload), `SignIn` (token entry plus an inline how-to-get-a-token guide and a "where your token goes" explanation), `CollectionEditor`, `ItemForm`, `FieldInput` (all 11 types, slug derivation, image upload), `PreviewCard` (renders the **real** site cards live), `PublishPanel` (change review, mode choice, result links).
- [x] Only images actually referenced by the edited content are included in a publish.
- [x] `/admin` set to `noindex, nofollow`; `public/robots.txt` disallows it.

### Accomplishments — Safety and CI
- [x] `scripts/validate-content.mts` — re-parses every content file, re-runs the exact rules the editor enforces, and additionally verifies that every referenced photo exists in `public/`. Wired as `prebuild`, so a broken content file cannot be built.
- [x] `.github/workflows/deploy.yml` — push to `main` → validate → build (with repo coordinates and `SITE_BASE_PATH` injected) → `.nojekyll` → deploy to Pages, with `concurrency: pages, cancel-in-progress` so two publishes never race.
- [x] `.github/workflows/pull-request.yml` — PR → validate, lint, typecheck, build. Gates the "Ask for review first" path.
- [x] `package.json` — added `prebuild`, `typecheck`, `validate:content`; `start` now serves the static `out/`.
- [x] `.env.example` documenting the four public build-time variables.

### Notes
- Everything remains **uncommitted on `feat/modernized-site-prototype`**, consistent with the standing IDLC constraint of no pushes and no pull requests.

---

## 20260808

### Decisions
- Documented the system in `PROJECT-DOCUMENTATION.md` and `PROJECT-LOG.md`, patterned after `~/Workspace/business/velocity-members`, as requested in the 20260807 brief.
- Recorded the CMS trust model explicitly (anyone with write access can publish directly, deliberately) along with the branch-protection path if the program later wants review enforced — so the choice is visible rather than implicit.

### Accomplishments
- [x] **Verified the build end to end**: `npm run validate:content` → *Content OK — 12 file(s) validated*; `tsc --noEmit` clean; `next build` succeeds, exporting **15 static routes** (home, 8 section pages, 3 team detail pages via `generateStaticParams`, 404, and `/admin`).
- [x] Wrote `PROJECT-DOCUMENTATION.md`: overview, purpose, architecture diagram (browser → GitHub → Actions → Pages), stack table, the 12-collection content model, publish flow, auth/security and trust model, the three-layer content safety story, dev setup, project layout, deployment setup, a volunteer-facing editor guide, and known limitations.
- [x] Wrote `PROJECT-LOG.md` (this file), reconstructing the 20260802 prototype and 20260807 CMS work from the working tree, `IDLC.md`, and `IMPLEMENTATION_SUMMARY.md`.

### Update — live-site content sync + mobile pass (20260808)

**Context**: the program had updated kleinoakvolleyball.com since the 2026-08-02 reference pass. Pulled the live site (home, the three team pages, coaches, schedule, sponsorships, board, spirit wear) and folded the changes into the prototype.

**What had changed on the live site**
- **The 2026 rosters are now published** — a roster table for four levels, posted August 3 with "Congratulations Panthers!". The prototype was still rendering "Roster & photos coming soon".
- **A fourth level exists: Flex.** The prototype only modeled Varsity / JV / Freshman. The live nav reads "Freshmen & Flex", and picture day and the schedule both list Flex as its own team.
- **The full 2026 season schedule is published** as an image: summer, preseason, district, and playoffs, with a separate start time per level. The prototype had no match data at all and deferred entirely to Rank One.
- **Team pictures** — August 9 at the KOHS Main Gym, staggered by level (Freshmen 9:00, Flex 9:40, JV 10:20, Varsity 11:00).
- Sponsors are labelled "2025 SPONSORS" and include an extra gold sponsor (NHE) the prototype was missing.
- Spirit Wear is explicitly "Coming Soon"; the prototype had guessed at an unverified store link.
- The schedule page carries a **direct Rank One URL** for this program, rather than the generic parent-portal login.

**Decisions**
- **Rosters are transcribed from the program's own published table.** These are student names, so the rule adopted is: mirror exactly what the program has already made public, add nothing (no jersey numbers, no photos, no statistics — the program publishes none), and keep it one field that can be cleared in the editor when the season ends. The schema help text says so, and so does `src/data/teams.ts`.
- **The schedule is transcribed too, but Rank One stays the source of truth.** The program's spreadsheet is the plan; Rank One carries the late changes. The page leads with a Rank One link and says exactly that.
- **Two "530"/"430" cells were normalized to 5:30/4:30** — an obvious spreadsheet typo, and left as-is they would have rendered as nonsense times.
- **Times use a new dotted-path field group** (`times.varsity`, `times.jv`, `times.flex`, `times.freshmen`) rather than a new field type — the CMS already supports dotted names, so the editor got the schedule for free.
- **The schedule renders as two layouts, not one.** A four-level table is right on a laptop and impossible on a phone, so wide screens get the table and phones get one card per match with the four times in a 2×2 grid. Only one is in the DOM at a time (`display:none` keeps the other out of the accessibility tree).

**Accomplishments**
- [x] `content/matches.json` — **39 dated entries** across preseason (8), district (24), and playoffs (7), each with per-level times, home/away, and notes (tournament addresses, "leave Wednesday after 7th period").
- [x] `content/teams.json` — added **Flex**; added 2026 rosters to all four levels (Varsity 17, JV 15, Flex 14, Freshman 15 — 61 players).
- [x] New `matches` collection in `src/cms/schema.ts`, new `Schedule` sidebar group, `roster` field on teams, `rankOneScheduleUrl` on site settings — all editable at `/admin`.
- [x] New `src/data/matches.ts` loader and `src/components/schedule/MatchSchedule.tsx` (table + card layouts, blank vs. "x" distinguished for screen readers as "Not listed" / "Not playing").
- [x] Rebuilt `/schedule`: Rank One callout, three sections, and program dates on a dark band. Rebuilt team detail pages to render the roster.
- [x] Added Flex to the nav, and made the home hero's "Program Levels" list data-driven from `teams` (it was a hardcoded array of three) — now four linked cards.
- [x] Widened the team grids from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`; updated hero/footer/teams copy that said "Varsity, Junior Varsity, and Freshman".
- [x] Content updates: team pictures + team bonding + daily practice + first district match added to key dates; announcements reworked for a season in progress; NHE added to gold sponsors; spirit wear marked "Coming Soon" per the program; direct Rank One link added to resources and site settings; camps renamed to the program's wording ("Sport Specific Instruction").
- [x] Fixed the socials Facebook URL to the program's actual profile URL (the old vanity path was a guess).

**Verified**
- [x] `validate:content` → 13 files; `tsc --noEmit` clean; `eslint` clean; `next build` → **16 static routes** (adds `/teams/flex`).
- [x] **No horizontal overflow on any page at 375px** — measured `scrollWidth` vs `clientWidth` for all 11 routes in a 375px iframe. The one element wider than the viewport is the camp pricing table, which scrolls inside its own container by design; the page itself does not.
- [x] Mobile (390px) screenshot-verified: schedule cards, roster list, home hero levels, and the hamburger menu (`aria-expanded` toggles; Flex present in the Teams sub-list).
- [x] Desktop screenshot-verified: district table with home/away badges and per-level times.
- [x] Console clean on the schedule page — no errors, no hydration warnings.

### Not yet done
- [ ] **End-to-end browser verification against a real GitHub repository** — sign in with a fine-grained token, edit a collection, publish directly, confirm the commit and the Pages deploy; then repeat via "Ask for review first" and confirm the PR body and `pull-request.yml` run. This is the single largest untested surface: everything below the browser is verified, the GitHub round-trip is not.
- [ ] Commit the CMS work (still entirely uncommitted; `IDLC.md` forbids pushing and opening PRs, but a local commit is overdue).
- [ ] One-time repository setup on the real repo: Pages source = GitHub Actions, `SITE_BASE_PATH` variable if not on a custom domain, collaborator invitations.
- [ ] A short written walkthrough for the Booster Club, and one supervised run with an actual volunteer — the real test of whether the editor is usable by its audience.
- [ ] Replace prototype copy and confirm the `verified` flags with the Booster Club; add coach bios and team photos once content and publication permissions exist.
- [ ] **Have the program proof-read the transcribed rosters and schedule.** 61 student names and ~39 schedule rows were read off two published images by hand; a misspelled player name is a real harm, and only the program can confirm them. Also confirm they want rosters on this site at all.
- [ ] Identify the sponsor logos published without a readable business name (one platinum, two gold, one black) — they were left out rather than guessed at.
- [ ] Resolve the Booster Club email discrepancy: the sponsorships page shows both `kovolleyballbooster@gmail.com` and `khsvolleyballbosterclub@gmail.com`; the board page shows only the former, which is what this site uses.
