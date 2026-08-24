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

---

## 20260809

Branch `20260809/feature/landing-upgrades`. A small, self-contained aesthetics pass on the home page hero, specified by an annotated screenshot in `IDLC.md`: put the faceted panther logo in the hero, and make the hero background plain black with the diagonal stripes removed.

### Decisions
- **"The faceted panther logo" is option 1a** from `logo-redesign/ko-panthers-logo-options.html` — the flat-plane crest, named "Faceted Panther" in that file. The three `modern_panther_logo_variant_*.png` renders in the same folder are a different, more illustrative direction and were left alone; the faceted mark is the one that survives being shrunk.
- **Shipped as an inline SVG component, not a PNG.** The source artwork is already vector, so `src/components/icons/PantherMark.tsx` carries the paths directly: sharp at any size, no extra network request, and it recolours with a Tailwind text class. This follows the existing `SocialIcons.tsx` convention rather than introducing an image asset.
- **The face details are masked out, not painted black.** The original artwork draws the eyes, snout, and cheek notches as black shapes on top of the gold plane, which only looks right on a black background. Replacing that with an SVG `<mask>` makes them genuinely transparent, so the same component works on black, gold, or white. This also sidesteps a real geometry problem: the two cheek-notch triangles straddle the outer silhouette edge, so an `even-odd` single-path knockout would have left visible spurs outside the head.
- **The mark uses the site's existing gold (`--color-accent`, `#c6a15b`), not the logo document's `#F5B317`.** The hero eyebrow, headline accent, and buttons are all already on the site token; introducing a second, brighter gold a few pixels away from them would have read as a mistake. Worth revisiting only if the program adopts the logo document's palette site-wide.
- **"Plain black" is taken literally — `bg-black` (`#000`), not the `--color-primary` near-black (`#0d0d0d`).** The rest of the site's dark surfaces keep using the token; only the hero band is true black, which is what the annotation asked for.

### Accomplishments
- [x] New `src/components/icons/PantherMark.tsx` — the faceted crest, `currentColor`-driven, with a `maskId` prop so more than one instance can safely render on a page.
- [x] `Hero.tsx`: mark added above the eyebrow line at `h-24 w-24` (`sm:h-28 sm:w-28`); background changed from `bg-primary` to `bg-black`; the absolutely-positioned `repeating-linear-gradient` stripe overlay deleted outright rather than hidden.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean.
- [x] Rendered HTML confirms the mark is present once, `bg-black` is applied, and no `repeating-linear-gradient` remains anywhere on the page.
- [x] Screenshot-verified at 1440px and 390px, and compared against a before-shot taken with the change stashed — the stripes are visibly gone and nothing else in the hero moved. (Both shots clip identically at 390px in headless Chrome, which emulates no mobile viewport; that is a capture artifact, not page overflow, and it is unchanged by this work.)

### Not yet done
- [ ] **The header still uses the `KO` text lockup**, not the panther mark. The annotation only covered the hero, so the change stops there — but a program crest in the hero and a placeholder monogram in the sticky header directly above it is an inconsistency someone will notice.
- [ ] Decide whether the faceted mark is the program's actual logo or an exploration. Nothing else — favicon, footer, `/admin`, social cards — has been switched over, and it should not be until the Booster Club has picked a direction.
- [ ] The three `modern_panther_logo_variant_*.png` files are untracked working files in `logo-redesign/`; either commit them as part of the brand exploration record or drop them.

### Update — full logo lockup + brand yellow (20260809, same branch)

**Context**: a second annotated pass on the same hero. Three asks: use the *actual* faceted logo rather than the bare icon, drop the Program Levels card and give the freed width to the logo, and replace the site's faded gold with the yellow from the logo.

**Decisions**
- **"The actual faceted logo" is the lockup, not a different drawing.** The crest geometry shipped earlier already matches the reference rendering path-for-path; what was missing is everything around it — the wordmark, the flanking rules, the scale, and the saturated yellow. So `PantherMark` is unchanged and a new `PantherLockup` composes it with the wordmark.
- **The wordmark is split across the two lines of the existing design: `KLEIN OAK` large in white, `VOLLEYBALL` small in gold between two rules.** The annotation reads `Change to "KLEIN OAK VOLLEYBALL"` with the arrow landing between the reference's two lines. Read as a whole the lockup now says exactly that, and the designed two-line structure survives. **The alternative reading — swap only the big word, giving `KLEIN OAK VOLLEYBALL` stacked above a second `VOLLEYBALL` — was rejected as redundant, but it is a one-line change in `PantherLockup.tsx` if that was the intent.**
- **The lockup scales from a single width using CSS container queries.** It declares `@container` and sizes the mark, wordmark, rules, and gaps in `cqw`/percentages, so the caller passes `w-64 sm:w-80 lg:w-96` and everything inside stays in proportion. The alternative — a parallel set of `text-*` breakpoints for each element — drifts the moment anyone touches one of them.
- **`--color-accent` becomes `#f5b317`**, the "Klein Oak Gold" already named in `logo-redesign/ko-panthers-logo-options.html`. The screenshot could not be sampled directly (the sandbox refuses to read `~/Desktop`), so the value comes from the brand document rather than a pixel measurement.
- **The gold had to split into a dark-surface and a light-surface value, because no single yellow can do both.** `#f5b317` is 11.3:1 on black and 1.9:1 on white — vivid where the brand wants it, illegible as text on a light page. Audited every `text-accent` in the codebase first: all of them sit on `bg-primary`, `bg-black`, or a dark card, and all of them got better. Light surfaces already used `--color-accent-strong`, so that token absorbed the constraint instead: **`#a9812f` → `#8a6a0a`**, the logo document's own link gold, which raises contrast on white from 3.58:1 (a pre-existing AA failure for normal text) to 5.06:1 while reading as a richer, more saturated gold than the muddy value it replaces.
- **Removing Program Levels strands nothing.** The four team pages remain linked from the primary nav, from `QuickAccess` ("Team Information"), and from the `TeamExperience` section further down the same page, which renders a `TeamCard` per level.

**Accomplishments**
- [x] New `src/components/brand/PantherLockup.tsx`; `PantherMark.tsx` moved from `components/icons/` into the new `components/brand/` folder so the two brand pieces live together (`components/icons/` keeps the social glyphs).
- [x] `Hero.tsx` rebuilt: lockup on the left at `w-64 sm:w-80 lg:w-96`, the eyebrow/headline/blurb/buttons moved into the right-hand column, the Program Levels card deleted. Stacks to a single centred column below `lg`, so the phone layout is lockup-then-copy rather than a squeezed two-up.
- [x] `globals.css`: both gold tokens retargeted, each with a comment saying which background it is for.

**Verified**
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 16 static routes.
- [x] Screenshot-verified at 1440px (home, teams, schedule, sponsors) and 430px. The yellow is vivid on every dark surface; light-surface eyebrows, icons, and links stay legible on the darker token.
- [x] Confirmed no `text-accent` anywhere in `src/` renders on a light background.

**Not yet done**
- [ ] **Confirm the wordmark reading** — `KLEIN OAK` over `VOLLEYBALL` versus `KLEIN OAK VOLLEYBALL` over `VOLLEYBALL`. See the decision above.
- [ ] **The nav's active-link gold is now darker, not brighter.** That is the accessibility constraint, not an oversight: gold text on a white header cannot be vivid and legible at once. If the program wants the header to *look* brighter, the fix is a dark header bar, not a lighter gold — worth raising rather than quietly reverting the contrast.
- [ ] The header monogram is still the `KO` text block while the hero now carries the full crest — the inconsistency called out last pass is now more visible, not less.

### Update — hero logo replaced with the illustrated panther mark (20260809, same branch)

**Context**: a third brand direction. The faceted flat-geometry crest is out; the hero now carries `logo-redesign/panther-black-high-res-with-words-01.png` — an illustrated panther head over a gold volleyball, with a soft glow and the `PANTHERS / KLEIN OAK · VOLLEYBALL` wordmark already baked in.

**Decisions**
- **This one has to be a raster.** The previous two passes shipped inline SVG on the argument that the art was already vector. This art is not: the glow is a soft radial falloff that vector shapes do not reproduce. So the hero uses `next/image` against a prepared PNG.
- **The black backing was converted to real transparency rather than left as a square.** The source is a 1024px square with a white frame and a `#0d0d0d` panel, and `#0d0d0d` on a `#000` hero is a faintly visible grey box. Since the art is light-on-black, luminance is opacity: strip the black level, set `alpha = max(R,G,B)`, un-premultiply the colour. The logo now composites back to the exact original on black and degrades gracefully on any other dark surface.
- **Two bugs found and fixed during that conversion, both worth remembering** — the recipe is written up in `PROJECT-DOCUMENTATION.md`:
  - Un-premultiplying a near-zero alpha divides by almost nothing and produces bright white. Left in, those invisible pixels got rounded up by the palette step into **a light-grey haze filling the entire logo box** — caught on the first screenshot. Fix: zero RGB and alpha below a cutoff of 10 *before* dividing.
  - Cropping the white frame by bounding box alone leaves a 1–2px anti-aliased rim, which survives as a bright edge. Fix: detect the panel by requiring ≥90% dark pixels per row/column, then inset 4px.
- **Quantised to 256 colours only after the cutoff was in place.** 395 KB → **74 KB** with corners verified fully transparent and no visible banding in the glow. Order matters here: quantising first is what amplified the white-pixel bug.
- **Deleted `PantherMark.tsx` and `PantherLockup.tsx`.** They had no remaining references, and leaving two competing logo implementations in `src/` is how the wrong one eventually ships. Both are recoverable from commit `7aeecda` if the faceted direction comes back.

**Accomplishments**
- [x] `public/images/brand/panther-logo.png` — 695×646, ~74 KB, transparent background, tight-trimmed.
- [x] `Hero.tsx` uses `next/image` with `priority` (it is the largest above-the-fold element), explicit intrinsic dimensions, and a `sizes` hint matching the three rendered widths. Placement adjusted for the new near-square aspect: `w-72 sm:w-80 lg:w-[26rem]`, hero padding tightened from `py-20/28/32` to `py-20/24/28` since the mark is bulkier than the tall faceted lockup.
- [x] `src/components/brand/` removed.

**Verified**
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 16 static routes, and the asset lands at `out/images/brand/panther-logo.png`.
- [x] Screenshot-verified at 1440px and 430px: the glow blends into the hero with no box, halo edge, or grey patch.

**Not yet done**
- [ ] **The site now carries two unrelated panther identities**: this illustrated mark in the hero, and the `KO` monogram in the header on every page. That was a minor inconsistency when the hero held the faceted crest; with a fully illustrated logo it is conspicuous.
- [ ] `logo-redesign/` now holds three more untracked source renders (`panther-black-hero-01.png`, `panther-black-high-res.png`, and the one used here). Decide what belongs in the repo as the brand record.
- [ ] The wordmark says `PANTHERS / KLEIN OAK · VOLLEYBALL`, which reinstates "Panthers" as the lead word — the opposite of the previous pass's annotation. Worth confirming which wording the program actually wants before this reaches anyone.

---

## 20260810

Branch `20260810/fix/asset-base-path`, off `main` after PR #2 squash-merged.

### Context
Building a static export for a sub-path deployment (`codinci.com/kovb/`, a folder inside an existing `*.github.io` repo) surfaced a bug that had been latent since the static-export work: **`next/image` does not apply `basePath` to `src` when the image is `unoptimized`.** Pages cannot run Next's optimizer, so every image on this site is unoptimized, and every image `src` was being emitted root-relative. The hero logo and the Junior Varsity team photo both 404'd.

This was never specific to the `codinci.com` deployment. It would have broken the **GitHub Pages project-site** case the repo was designed for — `https://<user>.github.io/ko-volleyball-web` with `SITE_BASE_PATH` set — which is exactly the configuration `.env.example` documents. It went unnoticed because no sub-path build had ever been produced: the repo's own Pages deploy has never once succeeded (Pages was never enabled; see the deploy note below).

### Decisions
- **Fixed with a shared `assetPath()` helper (`src/lib/asset.ts`) rather than a per-call-site string concat**, because the same rule has to hold for paths that arrive from `content/*.json` — a volunteer uploading a photo through `/admin` must not have to know about base paths. `src/cms/components/FieldInput.tsx` already had a local `basePath` const; the new helper is the general form of it.
- **Not fixed by dropping `basePath` and using relative URLs.** Relative paths would break the App Router's client-side navigation, and `basePath` is the mechanism Next provides for exactly this.
- **No automated guard added.** Nothing in `tsc`, `eslint`, or `next build` can catch a missed `assetPath()` call, and inventing a lint rule for two call sites is not worth it. The documentation records the `grep` check instead.

### Accomplishments
- [x] `src/lib/asset.ts` — `assetPath()`, prefixes `NEXT_PUBLIC_BASE_PATH`, pass-through for non-root-relative values.
- [x] Applied at both image call sites: `Hero.tsx` (brand logo) and `teams/[slug]/page.tsx` (team photo).
- [x] Documented the rule in `PROJECT-DOCUMENTATION.md` next to the logo-preparation notes.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean.
- [x] `NEXT_PUBLIC_BASE_PATH=/kovb npm run build` → 16 routes, and a sweep of the whole export for `(href|src)="/…"` paths lacking the `/kovb` prefix returns **nothing**. Before the fix it returned both images.
- [x] End-to-end: served the target `*.github.io` repo root locally and confirmed `/kovb/`, `/kovb/teams/`, `/kovb/schedule/`, the logo, the `_next` CSS and JS chunks, and the repo's own existing `/` all return 200. Screenshot renders correctly.

### Deployment note (`codinci.com/kovb/`)
The export was copied to `thecodinci.github.io/kovb/` for a manual deploy. Two things that deployment depends on, recorded because they are easy to lose:
- **Built with `NEXT_PUBLIC_BASE_PATH=/kovb`.** A default build puts every asset at the domain root and the site renders unstyled.
- **`.nojekyll` was added at the *repo root*, not just in `kovb/`.** Jekyll strips paths beginning with an underscore and Next puts all its assets in `_next/`. Verified first that the host repo has no `_config.yml`, Gemfile, or underscore directories, so disabling Jekyll cannot affect the existing site.

### Not yet done
- [ ] **This repo's own Pages deploy has still never succeeded.** Both `deploy.yml` runs (PR #1 on 20260809, PR #2 on 20260810) failed at `actions/configure-pages@v5` with *"Get Pages site failed"* — `GET /repos/…/pages` returns 404, i.e. **Pages has never been enabled on `alfredsilvertonai/ko-volleyball-web`**. Fix is one setting: Settings → Pages → Source: GitHub Actions, then re-run the failed workflow. If that site is served from a project sub-path rather than a custom domain, it also needs the repository variable `SITE_BASE_PATH=/ko-volleyball-web` — which the fix in this branch is a prerequisite for.
- [ ] The `codinci.com/kovb/` copy is a **manual, point-in-time export**. It has no pipeline: nothing rebuilds it when `main` changes, and `/admin` publishing does not reach it. Either wire up a workflow or treat it as a preview and say so.
- [ ] Publishing that copy puts the **61 transcribed student names and the hand-read schedule on a public domain**, still unverified by the program. Flagged on every pass since 20260808 and still outstanding.

---

## 20260810 — Retire Camps & Tryouts; add a fourth coach

Branch `20260810/feature/remove-camps-add-coach`, off `main` after PR #3.

### Decisions
- **"Remove Camps & Tryouts" was taken as retiring the whole surface, not just hiding a section.** Half-measures are worse than either extreme here: a nav entry pointing at a deleted page 404s, and a live page nothing links to is orphaned content that goes stale unwatched. So the page, the home section, the nav entry, the Quick Access tile, both call-to-action buttons, the data loader, the three CMS collections, and the three content files all went together.
- **The CMS collections went with it.** `camps`, `tryouts`, and `tryout-milestones` existed only to feed that page; leaving them would show a volunteer an editable "Camps & tryouts" group in `/admin` whose changes appear nowhere. Recoverable from git when next season's camps are announced — that is the intended way back, not a hidden page.
- **`site.campBrochureUrl` was removed too.** Its only consumer was a hardcoded "Camp Registration" link in the footer. Left in place it would have been a `required: true` field in Site Settings that no page reads — exactly the kind of thing that survives for years because nobody can prove it is dead.
- **Two link slots needed refilling rather than deleting**, since dropping them would have left a lone button in the hero and a 3-of-4 gap in the Quick Access grid: the hero's second CTA is now `Teams & Rosters` → `/teams`, and the Quick Access tile is now `Coaches` → `/coaches`. The team-detail pages' ghost button became `Meet the Coaches`.
- **The coaches grid moved from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`**, matching the pattern the team grids already use. Three coaches fitted a 3-up row exactly; the fourth would have been stranded alone on a second row.

### Deliberately left in place
Three things still mention camps or tryouts. Each is a content decision rather than part of this structural change, and each is editable at `/admin` without a developer:
- **`Camp Registration` in Parent Resources** — an external link to Klein ISD's Rank One camp store, which is evergreen and not tied to the retired page. Removing it is a one-click content edit if the program wants it gone.
- **`9th Grade Tryouts` and `10th–12th Grade Tryouts` in Key Dates** — dated August 1 & 3, part of the season timeline the page exists to record. They read as history, not as an invitation.
- **"From first camp to senior night"** in the Culture section — prose about athlete development, not a pointer to anything.

### Accomplishments
- [x] Removed: `src/app/(site)/camps-tryouts/`, `src/components/home/CampsTryouts.tsx`, `src/data/camps.ts`, `content/camps.json`, `content/tryouts.json`, `content/tryout-milestones.json`, three schema collections, `campBrochureUrl` (schema + type + content), the footer camp link.
- [x] Updated: nav, home page composition, hero CTA, Quick Access tile, team-detail CTA, root metadata description, the `/admin` sign-in blurb (it listed "camps" among what the editor manages).
- [x] Added `Coach Studdard`, Assistant Coach, to `content/coaches.json` — fourth entry, same shape as the others, `bioAvailable: false` so the card shows "Bio coming soon" like the rest.

### Verified
- [x] `validate:content` → **10 files** (was 13); `tsc --noEmit` clean; `eslint` clean; `next build` → **15 routes** (was 16, `/camps-tryouts` gone).
- [x] Served the export and confirmed `/`, `/coaches/`, `/teams/varsity/` return 200 and `/camps-tryouts/` returns **404**.
- [x] Swept every built HTML page for "camp"/"tryout" and accounted for all six remaining occurrences — the three listed above, and nothing else.
- [x] Screenshot-verified: nav without the entry, hero with the new CTA, Quick Access with the Coaches tile, and all four coaches on one row.

### Update — program administration, ported back from hand-edited build output (20260810, same branch)

**Context**: while redeploying the `codinci.com/kovb/` export, the target folder turned out to contain a hand-edit that existed **only in generated HTML**. Commit `6c28d70` in `thecodinci.github.io` had patched `kovb/coaches/index.html` (and every copy of the RSC flight payload, to keep hydration consistent) to add the head coach's full name and a Program Administration section — names taken from the program's 2026-27 schedule PDF. A rebuild would have erased all of it without a trace.

**Decisions**
- **Ported into source rather than re-patching the output.** Editing built HTML is not a deploy step that survives anything; the same edit would have had to be redone by hand after every single build, and would eventually be lost on a build nobody thought to check. The fix belongs in `content/`.
- **Program administration is its own collection, not extra rows in `coaches`.** An athletic director and a principal are not coaching staff — merging them would put "Bio coming soon" under a principal's name and make the Coaches page claim things it should not. Separate collection, separate section, same card component.
- **`CoachCard` now hides the bio line only when `bioAvailable === false`, rather than on any falsy value.** Administration entries simply omit the field, so they render clean without needing a dishonest `bioAvailable: true`. Behaviour for coaches is unchanged — every coach record sets the flag explicitly.
- **`content/coaches.json` was reserialized to the CMS's canonical shape** (`JSON.stringify(value, null, 2)`, per `serialize()` in `validation.ts`). The old compact one-object-per-line formatting was hand-written and would have been rewritten by the first `/admin` publish anyway; doing it now keeps a future volunteer's diff to the field they actually changed.

**Accomplishments**
- [x] `content/administration.json` — Brandon Carpenter (Athletic Director), Thomas Hensley (Principal).
- [x] New `administration` CMS collection and `src/data/administration.ts` loader, so both entries are editable at `/admin` like everything else.
- [x] Head coach is now `Coach Bill Jenkins` in `content/coaches.json`.
- [x] Program Administration section on the Coaches page, below the biographies note, on the same 4-up grid.
- [x] Documentation: content-model table, project layout and file count, and two stale "camps" references in the Overview and Purpose sections left over from the retirement above.

**Verified**
- [x] `validate:content` → 11 files; `tsc --noEmit` clean; `eslint` clean; `NEXT_PUBLIC_BASE_PATH=/kovb` build → 15 routes with no unprefixed asset paths.
- [x] Deployed to `thecodinci.github.io/kovb/` and served that repo root: `/kovb/`, `/kovb/coaches/`, `/kovb/teams/varsity/` and the host site's own `/` all 200; `/kovb/camps-tryouts/` 404s. Screenshot confirms the rendered page matches the hand-edited version it replaces.

**Not yet done**
- [ ] The head coach's avatar initials now read **CBJ**, not **BJ** as in the hand-edit, because `initials()` derives from the full name and the name field includes the word "Coach". Cosmetic; fix by storing the name without the honorific, or by having `initials()` skip it.
- [ ] **Names came from a schedule PDF, not from the program's website.** They are real people's names on a public page — worth the same confirmation the rosters are still waiting on.
- [ ] The `kovb/` deployment is still a manual copy with no pipeline. The failure mode this entry documents — an edit that lives only in built output — is one a real deploy pipeline would have made impossible.

---

## 20260810 — Schedule: per-team views

Branch `20260810/feature/schedule-by-team`, off `main` after PR #4. Also carries the coach display reorder (Jenkins, Studdard, Patillo, Rehr) as its first commit.

### The problem
The schedule was "view all" only: three sections, every row showing four start times side by side. That is the shape the program publishes, and it is the right default — but almost every reader is following **one** level. A JV parent was scanning a four-column table and mentally discarding three quarters of it, on a phone, where those four times are a 2×2 grid inside every card.

### Decisions
- **A filter over the existing sections, not a new page per team.** Switching is instant, and — the deciding factor — the complete schedule stays in the prerendered HTML. Per-team routes would have meant five near-duplicate pages; reading the team from `?team=` would have meant `useSearchParams`, which on a statically exported page needs a `<Suspense>` boundary, and *the fallback is what ends up in the static HTML*. Neither is worth trading away a schedule that works with JavaScript off.
- **The accepted cost: a filtered view is not linkable.** I built URL syncing first and then removed it. Reading the query string on mount requires setting state in an effect, which `react-hooks/set-state-in-effect` correctly rejects — and the lint rule is right, because the alternative (initialising state from `window.location` during render) is a hydration mismatch: the build-time HTML says "all", the client would say "varsity". If shareable per-team links are wanted later, per-team routes are the honest way to get them.
- **Native radios in a `<fieldset>`, not buttons with click handlers.** Arrow-key navigation, focus management, and the "one of five" grouping announced to screen readers are all free from the platform. Styling is `peer-checked:` on a sibling `<span>`; the input stays in the accessibility tree via `sr-only` rather than `display:none`.
- **One `columns` list drives both layouts.** `MatchSchedule` takes an optional `level` and narrows `levelColumns` to a single entry; the table's headers and cells, and the phone card's time grid, all map over that same list. The two layouts cannot drift out of sync, and the card grid collapses from two columns to one automatically.
- **`x` hides a date; blank does not.** In the source data `"x"` means that level is explicitly not playing, so those dates are dropped from a filtered view. An empty cell means no time was published — the date may still belong to that level, so it stays visible and renders as "Not listed". Silently dropping those would be inventing information.
- **The filter says what it hid.** "Showing Junior Varsity only — 37 dates. 2 dates where Junior Varsity is not playing are hidden." A filtered list that quietly shrinks invites "is my daughter's game missing from this site?". The line is `aria-live="polite"`, so it is announced on change.

### Accomplishments
- [x] New `src/components/schedule/ScheduleBrowser.tsx` — filter control, per-section filtering, counts, hidden-date disclosure, and an empty state for a level with no published dates.
- [x] `MatchSchedule` takes an optional `level`; both the table and the phone cards narrow to one column from the same list.
- [x] `schedule/page.tsx` reduced to composing sections and handing them to the browser component.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] The prerendered `out/schedule/index.html` contains all five filter labels **and** the full 39-date schedule — the no-JavaScript path is intact.
- [x] Driven for real in headless Chrome over the DevTools Protocol, clicking the actual radios: All → 39 rows and 4 level columns per table; Junior Varsity → 37 rows, one "Junior Varsity" column, "2 dates … hidden"; Varsity → 36 rows, one column, "3 dates … hidden".
- [x] **Cross-checked those counts against `content/matches.json` directly** — `x` counts per level are varsity 3, jv 2, flex 3, freshmen 1, matching the rendered totals exactly.
- [x] Mobile (390px, device emulation): one time block per card instead of four, and `scrollWidth - clientWidth` measured **0** — no horizontal overflow.

### Not yet done
- [ ] A filtered schedule cannot be shared as a link. See the decision above; per-team routes are the way in if that becomes a real request.
- [ ] The filter does not persist across page loads. Deliberate — the alternatives were the hydration mismatch and the lint rule above — but a parent who always wants JV re-picks it each visit. `localStorage` read in an event handler after mount would solve it without the render-time mismatch, if it proves annoying.

---

## 20260812 — Sponsors: real logos, the form PDF, and a shorter footer

Branch `20260812/feature/sponsors-logos-and-form`, off `main` after PR #8. Four requested changes to the Sponsors page and footer.

### The problem
The Sponsors page listed seven businesses as plain uppercase text. The people who paid for a Platinum spot were getting a wordmark rendered in the site's own font — the one thing a sponsor is actually buying is their mark on the page. Step 1 of "Become a Sponsor" said *"Complete the Sponsorship Form"* with no way to obtain it. And the footer still carried the prototype disclaimer.

### Decisions
- **Logos live in their own collection, joined by name.** A tier's `sponsors` is a `stringList` in the CMS, which cannot hold objects, so artwork could not be nested inside the tier without breaking the `/admin` editor for that collection. `content/sponsor-logos.json` is keyed by exact business name; a sponsor with no entry falls back to its name. That fallback is the point — a business can be listed the day it signs up, artwork or not. **The cost is a join with nothing enforcing it:** rename a sponsor in one file and not the other and the logo silently disappears. Documented rather than validated, for now.
- **`bg-background` → `bg-white` on the sponsor card.** Supplied logos assume a white background; several of these are transparent PNGs with dark linework that would have sat on the site's off-white surface at slightly wrong contrast. This is the one visual change not explicitly requested, and it is there because the requested change would otherwise look subtly broken.
- **The card scales artwork, rather than the artwork being pre-fitted.** `max-h-16 w-auto object-contain` inside a fixed `h-24` card, with real `width`/`height` on every entry so nothing reflows as images load. Seven logos with aspect ratios from 3.8:1 (GulfPoint) to 1:1 (TAV, NHE) sit on the same row without letterboxing.
- **The PDF is content, not a hardcoded href.** Added `sponsorFormUrl` to `content/site.json` so the Booster Club can drop in next season's letter from `/admin` without a code change. It is a `public/` path, so it goes through `assetPath()` — the same sub-path trap that PR #3 fixed for images applies to any link into `public/`.
- **`public/documents/`, not `public/resources/`.** `/resources` is already a route; a `public/resources/` directory would collide with it in the export.
- **Corrected a stale note in the schema.** `sponsor-tiers`' help text read *"logos are not published without written permission from the sponsor."* That predates this change and now contradicts the code. Rewritten to describe the fallback behaviour and to say only publish artwork the sponsor supplied for the purpose — which is what step 3 of the program's own sponsorship instructions asks them to send.

### Accomplishments
- [x] Sponsors page eyebrow → "Community Support - Booster Club"; title → "2025 Sponsors".
- [x] Seven logos sourced from the program's live site into `public/images/sponsors/`, with per-sponsor alt text using each business's full name as it appears in its own mark (e.g. "Blaine Tomball" → *Blaine Scelfo, State Farm agent in Tomball*).
- [x] New `content/sponsor-logos.json` + `sponsor-logos` CMS collection (name + `image`), and `sponsorLogoFor()` in `src/data/sponsors.ts`.
- [x] `SponsorLogoCard` renders artwork when present, the business name otherwise.
- [x] "Download the Sponsorship Form (PDF)" in Get Involved, driven by `site.sponsorFormUrl`.
- [x] Removed the prototype disclaimer from the footer.

### Verified
- [x] `tsc --noEmit` clean; `validate:content` → 12 files OK; `next build` → 15 routes.
- [x] The supplied PDF is **byte-identical** (SHA-256) to the one already linked from the live site's Sponsorships page — publishing it exposes nothing new. It does contain a board member's personal mobile and email, which is why that was checked before linking rather than after.
- [x] All seven logo files opened and eyeballed — real marks, not error placeholders or hotlink-blocked stubs.
- [x] Built page driven in Chrome: eyebrow, title, three tiers, seven logos on white cards, and the PDF button all render; `/documents/sponsor-letter-2025-2026.pdf` serves 200 as `application/pdf`.
- [x] Footer line absent from every built page checked (home, sponsors, teams, contact).

### Not yet done
- [ ] **Nothing validates the tier↔logo join.** A rename in one file drops the logo with no error. `validate-content.mts` already checks that referenced images exist; checking that every logo name matches a tier entry belongs next to it.
- [ ] The home page Sponsors strip now shows Platinum logos too, via the shared card. Consistent, but it was not part of the request — worth a look to confirm it is wanted.
- [x] ~~The page still carries the "partial sponsor list … Booster Club should confirm" caveat.~~ Removed in PR #10 below, at the program's request. The underlying point stands: nothing on the site now signals that the roster is unconfirmed.
- [ ] `logo-redesign/` and the source `resources/` folder hold originals outside `public/`; only the copies under `public/` are served.

---

## 20260812 — Sponsors: caveat removed, form opens in a new tab

Branch `20260812/content/sponsors-caveat-and-form-target`, off `main` after PR #9. IDLC requests 5 and 6. PR #10.

### The problem
Two small follow-ups to the sponsors work. The page still closed with a paragraph calling the roster partial and gathered from the live site — copy written when the list was a best-effort transcription, which read oddly under seven real sponsor logos. And the sponsorship form replaced the page with a PDF, so a parent reading "Become a Sponsor" lost the three steps the moment they opened the form they describe.

### Decisions
- **`rel="noopener noreferrer"` alongside `target="_blank"`.** Not requested, and not optional: without `noopener` the opened tab receives a `window.opener` handle on the Sponsors page and can navigate it. The cost is nil, so it goes in by default rather than being raised as a question.
- **The label says so: "(PDF, opens in a new tab)".** A link that changes window context without warning is WCAG 3.2.5, and the surprise lands hardest on screen-reader users, who get no visual cue that a new tab appeared. Three words of copy is the entire fix.
- **Removed the caveat rather than rewording it.** It was two claims: *this list is partial*, and *the Booster Club should confirm before publishing officially*. The first stopped being true once the roster carried real artwork. The second is still true — but it is guidance for the Booster Club, not for a parent reading the page, and it was being addressed to the wrong audience. **Nothing on the site now marks the roster as unconfirmed**; if that matters, the `verified` flag already used by other collections is the mechanism, not prose.
- **Left the earlier entry's stale bullet struck through rather than deleted.** The log is a record of what was known when; silently editing a past "not yet done" into agreement with the present hides the fact that it was raised and then reversed.

### Accomplishments
- [x] Removed the provisional-roster paragraph from `sponsors/page.tsx`.
- [x] Sponsorship form link opens in a new tab, with `rel="noopener noreferrer"` and a label that says so.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Built page: caveat absent, tier headings and all seven logos still render, PDF link intact.
- [x] Checked inside the **pushed** deploy commit, not just the local build: `target`, both `rel` values, the label, `/kovb/`-prefixed href, 7/7 logos, `.nojekyll` present.

### Not yet done
- [ ] Carried forward from PR #9: **nothing validates the tier↔logo join**, and the home page Sponsors strip now shows Platinum logos as a side effect.
- [ ] No signal anywhere that the sponsor roster is unconfirmed, now the caveat is gone. `verified` is the existing mechanism if that is wanted.
- [ ] Browsers differ on `target="_blank"` to a PDF — inline viewer in Chrome and Firefox, immediate download and a self-closing tab in some configurations. Nothing in the markup controls which.

---

## 20260812 — Site icon, an explicit match status, and keeping dated content fresh

Branch `20260812/feature/icon-and-dynamic-dates`, off `main` after PR #12. IDLC request 8 plus two follow-ups. Google Analytics is **parked pending policy review** — `GOOGLE-ANALYTICS-SETUP.md` stands, nothing was implemented.

### The problem
Three unrelated things. The browser tab showed a scaffold favicon rather than the program's mark. The Pearland tournament (Aug 13–16) was badged **Tentative** on the home page although it is confirmed — every level's time reads TBD, and the code inferred "no times" meant "not settled". And the whole "Upcoming Events" list is filtered against a date that, in a static export, stops moving the moment the site is built.

### Decisions
- **The icon is an SVG of vector paths, not `<text>`.** A favicon gets no webfont, so `font-family: Oswald` would silently fall back to whatever the OS offers and the mark's proportions would change per platform. The letterforms are drawn as paths, so it renders identically everywhere. Checked side by side against the real header mark at 128/40/32/16px — still legible as "KO" at tab size, which is the only size that really matters.
- **Corner radius deliberately larger than the header's.** The header tile is `rounded-sm` (2px at 40px); the icon uses `rx=8` on a 64 viewBox. At favicon scale a 2px radius reads as a plain square. This is a small, intentional divergence from the header, not a mismatch.
- **SVG only, plus the existing `favicon.ico`.** No SVG rasteriser is available on this machine (no ImageMagick, rsvg, Inkscape, PIL, or cairosvg), so no PNG variants were generated. Next emits both `<link rel="icon">` tags; modern browsers take the SVG, older ones the `.ico`. An `apple-icon.png` is still missing — it needs a rasteriser, or a designer's export.
- **An explicit `status` on a match beats inferring one.** Added an optional `status` to `Match` that overrides the derived value. The inference stays as the default because it is right most of the time, but "times not published yet" and "might not happen" are genuinely different claims and only the program knows which applies. Guessing wrong in the confident direction is worse: a family plans around a fixture that evaporates.
- **A nightly rebuild, not client-side filtering.** This was the real question behind "a dynamic way to render upcoming events". Two options: re-filter in the browser after mount, or rebuild on a schedule. Chose the rebuild — `deploy.yml` now also runs at `0 11 * * *` (06:00 Central). It costs no client JavaScript, keeps the filtered list inside the prerendered HTML, and avoids a visible flash when the build-time list and the client-time list disagree. **It also follows the precedent this project already set**: the schedule filter (PR #5) deliberately rejected `useSearchParams` and effect-driven state to keep the full schedule in static HTML. Doing the opposite here for the same class of problem would have been inconsistent.
- **The accepted cost of that choice**, stated plainly: the list can be up to a day stale, GitHub disables scheduled workflows after 60 days of repo inactivity, and the hand-deployed staging copy never runs CI at all. If genuinely live behaviour is ever needed, client-side re-filtering after mount is the way in — and it can sit on top of this without conflict.

### Accomplishments
- [x] `src/app/icon.svg` — the header's KO mark as vector paths in Klein Oak black and gold.
- [x] Optional `status` on `Match`, honoured by `calendar.ts`, editable at `/admin` as a three-way select ("work it out from the times" / Confirmed / Tentative).
- [x] Pearland tournament (Aug 13–16) marked `confirmed`.
- [x] `deploy.yml` gains a daily `schedule:` trigger, with the reasoning and the 60-day caveat in a comment beside it.
- [x] Documented the nightly rebuild in `PROJECT-DOCUMENTATION.md` under Deployment.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes; content validation 12 files OK.
- [x] Icon rendered in Chrome beside the real 40px header mark at four sizes; `out/icon.svg` emitted and both `<link rel="icon">` tags present in the built HTML.
- [x] Built home page shows **Aug 13–16 Tournament [Confirmed]**.
- [x] The date filter demonstrably works: `Aug 11 Cy Ranch` dropped out of the list when the date rolled to the 12th, with no code change.

### Not yet done
- [ ] No `apple-icon.png` / maskable icon — needs a rasteriser this machine does not have.
- [ ] Google Analytics parked pending policy review, including the district question in `GOOGLE-ANALYTICS-SETUP.md` §2.
- [ ] Carried forward: nothing validates the sponsor tier↔logo join; no `public/.nojekyll`; production and the development repo can both accept `/admin` publishes and have no agreed source of truth.

---

## 20260812 — A second hero banner, and a carousel to hold both

Branch `20260812/feature/hero-carousel`. IDLC request 9. Adds the VBIF campaign artwork as a second hero banner, with the interaction design left open.

### The problem
One banner, two things to say. The requirement that shaped everything: **on load, the current banner is displayed** — the program hero must not be pushed aside by a campaign slide, and must not flicker into view after hydration.

### Decisions
- **Only the active slide is mounted.** The obvious build is to render both and hide one with CSS, and it is the classic carousel accessibility bug: a hidden slide still contains focusable links, so a keyboard user tabs into content nobody can see. Mounting one slide at a time makes that impossible by construction. Verified: the built page has **zero `<a>` elements** belonging to an inactive slide.
- **The first slide is server-rendered; the second exists only in the RSC payload.** Confirmed in `out/index.html` — the Hero markup is present, and there is no `<img>` for the campaign anywhere in the DOM. So the program hero is the first paint, it is what renders with JavaScript disabled, and the requirement is satisfied structurally rather than by a timer that happens to start at zero.
- **It does auto-rotate — with the things auto-rotation obliges you to add.** "On load, the current banner is displayed" implies it moves afterwards. So: 7s interval, an explicit pause/play control (WCAG 2.2.2 requires a mechanism to stop anything moving for more than five seconds), pause on hover and on focus so it cannot slide away mid-read or while tabbing, and **no rotation at all under `prefers-reduced-motion`** — the pause button is hidden in that case because there is nothing to pause.
- **The carousel holds the tallest slide's height.** This was the largest defect found in testing, and only by measuring: at desktop the campaign slide was **81px** taller than the hero, and on a phone it was **407px shorter** — the stacked hero is roughly twice a banner image. Every rotation yanked the rest of the page up or down. A `ResizeObserver` records the tallest slide seen and applies it as a floor, reset on viewport change so a desktop measurement does not leave a tall empty band on a phone. Measured after the fix: **0px delta at 1440px and at 538px**.
- **The campaign slide's padding matches Hero's exactly**, with the image width capped so its rendered height lands on Hero's. The floor alone would have worked, but matching the natural heights means the floor rarely has to do anything — belt and braces, and it keeps the desktop slide from being letterboxed.
- **Nothing is overlaid on the artwork.** It carries its own wordmark; a heading or call to action would be invented copy, and nobody has told me what VBIF is. `object-contain`, never `cover` — cropping a logo lockup cuts the mark in half.
- **Arrows sit at one-third height on phones, centre on larger screens.** At centre they overlapped the eyebrow line and clipped a letter. They are visible at every size deliberately: the dots sit at the bottom of an 841px slide on a phone, which is below the fold, so hiding the arrows on small screens would have left a phone user with no visible control at all.

### Accomplishments
- [x] `src/components/home/HeroCarousel.tsx` — client component: mounts one slide, arrows, dots, pause/play, arrow-key support, `aria-live` announcement, reduced-motion handling, and the height floor.
- [x] `src/components/home/CampaignBanner.tsx` — the VBIF slide, height-matched to Hero.
- [x] `public/images/brand/vbif-campaign.png` (1376×768) committed.
- [x] `hero-slide-in` keyframe in `globals.css` — a fade with 6px of travel, not a slide-across.
- [x] `Hero` itself is untouched; it is passed in as the first slide.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Prerendered HTML contains the Hero and **no** campaign `<img>` — the load-order requirement, checked structurally.
- [x] Driven in Chrome: arrows, dots, pause, and ArrowLeft/ArrowRight all work, including wrapping past either end.
- [x] Auto-rotation observed advancing at 7s; pause held the slide across two full intervals.
- [x] Slide heights measured equal at 1440px and 538px viewports.

### Not yet done
- [ ] **Nobody has said what VBIF is.** The alt text is just `"VBIF"`, and the banner links nowhere. A campaign banner that cannot be clicked is decoration — it wants a destination and a real accessible name.
- [ ] The artwork is an image of text, so the wordmark does not scale with a user's font size and cannot be read by a screen reader beyond the alt (WCAG 1.4.5). Unavoidable with supplied artwork; worth knowing.
- [x] ~~The PNG is **1.1 MB**, by far the largest asset on the home page.~~ Re-encoded to WebP — see below.
- [ ] Slides are hard-coded in `page.tsx` rather than being a CMS collection. Fine for two; if banners become a regular thing, they belong in `content/`.

### Follow-up, same day — the banner was 1.1 MB

Re-encoded `vbif-campaign.png` (1,096 KB) to `vbif-campaign.webp` (**34 KB, 96.9% smaller**) at 1376×768, unchanged dimensions.

- **Why it mattered here specifically:** `images.unoptimized` is on, because GitHub Pages cannot run Next's optimiser. So the committed file *is* the download — there is no build step quietly fixing it. A 1.1 MB hero asset on a school site whose audience is largely on phones is a real cost.
- **PNG was simply the wrong container.** The artwork is a photographic render — soft gradient, film grain, drop shadows — and PNG stores that with lossless per-pixel encoding. The pixels never needed to be lossless.
- **WebP q80 over AVIF q55**, even though AVIF came in at 10 KB. `next/image` with `unoptimized` emits a plain `<img>`, not a `<picture>` with fallbacks, so the choice is one format for everyone. WebP is supported everywhere that matters; AVIF is not quite. A 24 KB saving does not justify a broken banner for anyone.
- **Checked, not assumed:** compared 1:1 crops across the logo edge and the gradient background. WebP q80 is indistinguishable from the original and preserves the film grain; AVIF smooths it slightly. Confirmed in the browser that the WebP renders and decodes (1376×768, `image/webp`).
- **`sharp` was already available** as a Next dependency — no new tooling. Earlier in the day I recorded that this machine had no rasteriser and skipped generating PNG icon variants; that was true of SVG rasterisers, but I had not checked for `sharp`, which handles raster-to-raster work. Worth remembering for the outstanding `apple-icon.png`.
- The original PNG moved to `logo-redesign/vbif-campaign-source.png`, alongside the other brand sources. It is not served, but it does add 1.1 MB to the repository — consistent with the other source artwork already there, and worth dropping if repo size becomes a concern.

---

## 20260813 — Google Analytics wired in

Branch `20260813/feature/google-analytics`. GA4 property `G-HEED59B487` created by the program; steps 3–5 of `GOOGLE-ANALYTICS-SETUP.md` implemented. GA had been parked pending policy review and was un-parked.

### The problem
No measurement of any kind. The program wanted to know which pages families actually use, and whether the sponsorship form gets downloaded — the one number a sponsor conversation can be built on.

### Decisions
- **The tag is guarded on `NEXT_PUBLIC_GA_ID`, and that guard is the environment strategy.** No ID means no tag is emitted at all, so `npm run dev` and the hand-deployed staging copy report nothing by construction. The alternative — one property plus a hostname filter — needs the filter applied correctly in every report forever. Confirmed both ways: a build without the variable contains **zero** `googletagmanager` references; a build with it contains the tag on every page.
- **`process.env.NEXT_PUBLIC_GA_ID` appears as that exact literal.** Next inlines these by textual substitution at build time, so reading it through a variable or computed key silently yields `undefined` — a failure that looks like working code.
- **`<GoogleAnalytics>` alone was not enough, and this was the real finding.** It injects gtag.js, which reports the document that loaded and nothing after. Every internal link here is a pushState navigation, so a visitor reading five pages would have reported as **one page view**. Measured rather than assumed: instrumenting `sendBeacon`, `fetch`, `XHR` and image beacons and then navigating produced **zero** outgoing hits, with `dataLayer` holding only `js` and `config`. Added `src/components/analytics/PageViews.tsx` to send `page_view` on pathname change. After the fix: exactly one `page_view` per navigation with the correct `page_path`, and no duplicate for the landing page.
- **`usePathname`, never `useSearchParams`.** The latter forces a Suspense boundary in a statically exported route, and the *fallback* is what lands in the prerendered HTML — the same trap the schedule filter hit in PR #5. No route on this site is distinguished by a query string.
- **The property setting now matters to the code.** Enhanced measurement's "page changes based on browser history events" does the same job as `PageViews`. Both active means every navigation counted twice, invisibly. Documented as a required toggle rather than left to chance, because the failure mode is inflated numbers that look plausible.
- **A variable, not a secret.** The Measurement ID ships in the HTML by necessity; storing it as a secret would only obscure what is deployed.

### Accomplishments
- [x] `@next/third-parties` installed; `GoogleAnalytics` rendered in `src/app/layout.tsx` behind the ID guard.
- [x] `src/components/analytics/PageViews.tsx` — route-change page views.
- [x] `deploy.yml` passes `NEXT_PUBLIC_GA_ID: ${{ vars.GA_MEASUREMENT_ID }}`.
- [x] `.env.example` documents the variable and why it is empty by default.
- [x] `GOOGLE-ANALYTICS-SETUP.md` updated with a status block, the route-change finding, and the enhanced-measurement warning.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Build without the ID: 0 `googletagmanager` references. Build with it: tag present on `/`, `/schedule/`, `/sponsors/`, `/teams/`.
- [x] In Chrome: gtag.js injected, `window.gtag` a function, `dataLayer` configured with `G-HEED59B487`.
- [x] Route tracking measured end to end by instrumenting all four GA transports across two client-side navigations.
- [x] Confirmed `alfredsilvertonai/ko-volleyball-web` has **no** Pages site, so production is the only environment that can report.
- [x] Confirmed production serves the Actions artifact, not repository source: `/package.json`, `/README.md`, `/src/app/layout.tsx` all 404.

### Not yet done
- [ ] **`GA_MEASUREMENT_ID` is not set on the production repo.** I have read-only access to `kleinoak/kleinoak.github.io` (403 on the variables API), so this is a manual step. **Until it is set, production collects nothing.**
- [x] ~~**Enhanced measurement's history-event tracking must be turned off** or navigations double-count.~~ Moot: the program has Enhanced measurement switched **off entirely**, so there is no history listener and `PageViews` is the only source of navigation events — verified as exactly one `page_view` per navigation, no duplicates. The trade is that outbound clicks, scroll depth and **file downloads** are not measured either, so sponsorship-form opens are currently invisible. Turning Enhanced measurement back on and disabling only its "page changes based on browser history events" sub-toggle would recover those without reintroducing the double count.
- [ ] **Step 2 of the setup guide — the privacy work — was never done.** GA was parked for policy review and then un-parked without it. Google Signals and ad personalisation should be confirmed off, retention set deliberately, and the district asked whether it has a position on analytics for program-affiliated sites. The audience here is minors.
- [ ] No consent banner and no privacy notice on the site. See the guide's §2; this is a decision, not an oversight.
- [ ] `npm audit` reports 4 high-severity advisories in Next's own transitive `postcss` and `sharp`. Pre-existing, not introduced here; the fix bumps Next 16.2.12 → 16.3.0, which is a framework upgrade and its own piece of work.

---

# 🚀 20260813 — LIVE. Website officially deployed.

**https://kleinoak.github.io/** — the Klein Oak Panther Volleyball site is in production and serving. A successful deployment: green on the first CI run, and every check since.

Eleven days from a local prototype (20260802) to a live site the program owns.

### What is live
- **Production:** `kleinoak/kleinoak.github.io`, built and deployed by GitHub Actions on every push to `main`, plus a nightly 06:00 Central rebuild so date-filtered content does not freeze.
- **The site:** home with a rotating hero, teams and four per-team pages, the full 39-date schedule with per-level filtering, coaches, resources, sponsors with real artwork, contact — 15 routes.
- **The CMS at `/admin`**, publishing straight to the production repo with no backend, no database, and no hosting bill.
- **Analytics**, verified firing against the live site.
- **Staging** at `codinci.com/kovb/`, deliberately built without an analytics ID.

### Verified at launch
- [x] Homepage 200 with stylesheet loading; `/sponsors/`, `/schedule/`, `/teams/varsity/`, `/admin/` all 200.
- [x] Production serves the Actions artifact, not repository source — `/package.json`, `/README.md`, `/src/app/layout.tsx` all 404.
- [x] No base-path prefixes on a root-served site; no unprefixed `/_next/` references.
- [x] GA4 hit confirmed reaching `google-analytics.com/g/collect` from the live domain, with `page_view` firing correctly across client-side navigations.
- [x] No "(Prototype)" anywhere in the shipped pages.

### What launch does not mean
The site is live; it is not finished, and two of these are about real people rather than code.

- [ ] **No editors have access yet.** Collaborators must be added to the production repo, and every editor needs a *new* fine-grained token scoped to it — tokens are per-repository, so existing ones do not carry over. **Until this is done the program cannot update its own site**; only the developer can.
- [ ] **The privacy work was never completed** (setup guide §2). Analytics is now collecting from a site about minors without Google Signals and ad-personalisation having been confirmed off, without a deliberate retention setting, and without asking the district whether it has a position. This is the most pressing open item.
- [ ] **Two repositories can both publish**, and no source of truth has been agreed. The first `/admin` publish from the wrong one starts a divergence that has to be merged by hand.
- [ ] **The `kleinoak` account is a personal User account.** Whoever holds that password owns production. It needs a program-owned email address and recovery codes the board can reach.
- [ ] Content the program still has to confirm: the sponsor roster now carries real logos with nothing marking it unconfirmed; `spirit-wear` is still flagged unverified; coach biographies and photos are unpublished; and the tagline is prototype copy now marked official.
- [ ] Engineering: nothing validates the sponsor tier↔logo join; no `public/.nojekyll`; no `apple-icon.png`; the VBIF banner links nowhere and its alt text is just "VBIF"; `npm audit` shows 4 high-severity advisories in Next's transitive dependencies.

---

## 20260814 — Shorter hero, and production stops carrying our notes

Branch `20260814/feature/compact-hero-and-prod-strip`. Two unrelated requests: the first hero banner read as too large, and the internal `.md` files should not exist in the production repository.

### The hero was 611px, and that was too much
Both slides now render at **429px on desktop (−30%) and 677px on a phone (−20% from 841px)**, measured, with a 0px delta between slides at both widths.

- **Reduced the hero rather than padding the banner.** The two ways to make slides match are to grow the short one or shrink the tall one; the request was that the hero felt too large, so everything came down: logo `26rem → 19rem`, heading `text-5xl/6xl → 4xl/5xl`, body `text-lg → text-base`, padding `py-20/24/28 → py-10/12/14`, and the internal gaps with them. The campaign banner's width cap was then retuned (`43rem → 35.5rem`) so its natural height lands exactly on the hero's, leaving the carousel's height floor with nothing to do in the common case.
- **The real win is on the phone.** At 390px the controls were previously below the fold — the dots sat at the bottom of an 841px slide, so a visitor had to scroll to discover the banner rotates at all. At 677px they are within the first screen. Verified with `dotsWithinFold`.
- **Measuring mobile needed a workaround worth recording.** The Chrome window was in macOS fullscreen (`outerWidth: 0`), so `resize_window` silently did nothing while still reporting success — `innerWidth` stayed at 1440 and an early "49% reduction" reading was nonsense, comparing a desktop height against a mobile one. Loading the site in a **same-origin iframe** at `width=390` gives the inner document a genuine 390px viewport, media queries and all, and it can be measured from the parent. Simpler than fighting the window manager.

### Production no longer carries the working notes
`IDLC.md`, `PROJECT-LOG.md`, `PROJECT-DOCUMENTATION.md`, the two setup guides, `IMPLEMENTATION_SUMMARY.md` and `WEBSITE_EVALUATION.md` are for us; only `README.md` belongs in the production mirror.

- **Neither obvious approach works.** `.gitignore` does nothing for files that are already tracked, and deleting them in the production repo lasts exactly until the next `git push prod main` puts them back.
- **So `scripts/deploy-prod.sh` rewrites a throwaway branch and force-pushes it.** It resets `prod-deploy` to `main`, `git rm --cached`s every tracked `*.md` except `README.md`, commits, and force-pushes to `prod/main`. Production's history becomes a deployment artefact rather than a source of truth — which it already was in substance; `origin` is the source of truth. The script refuses to run on a dirty tree, or when `main` and `origin/main` disagree, so what ships is always what was reviewed.
- **`git push prod main` must not be used again.** It would restore the docs and conflict with the rewritten history. The script is now the only supported route, and that is stated in the setup guide.
- **Nothing in the site depends on a `.md` file** — checked across `src/`, `scripts/`, `next.config.ts`, `package.json` and the workflows before removing anything.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Slide heights equal at 1440px (429/429) and at 390px (677/677).
- [x] Carousel behaviour unchanged: arrows visible at both widths, dots within the fold on mobile, pause still holds.
- [x] No `.md` reference anywhere in application code or CI config.

### Not yet done
- [ ] The production repository's history is rewritten on every deploy. Harmless for a mirror, but anyone who clones it and expects a stable history will be surprised. Documented, not prevented.
- [ ] Carried forward: no editors have production access; the privacy work in `GOOGLE-ANALYTICS-SETUP.md` §2 is still outstanding; two repositories can both publish with no agreed source of truth.

---

## 20260814 — Hero centring

Branch `20260814/fix/hero-centering`. Reported from the live site: the main hero looked off-centre.

### The problem
It was. The hero's `Container` is `flex flex-col … lg:flex-row` with `items-center` but **no horizontal justification**, so on desktop the row packed to the flex-start edge. The logo and text column together are narrower than the container, and the slack all collected on the right as a dead band of black — roughly 300px of it at 1638px wide. `items-center` centres the cross axis, which in a row is vertical; it does nothing horizontally, which is what made this easy to miss when the hero was taller and the imbalance less obvious.

### Decisions
- **`lg:justify-center`, not a wider text column.** The alternative was letting the text column grow to fill the row (`flex-1`), which would also have removed the gap — but at the cost of longer measure on wide screens, and the request was that it be centred, not that it fill.
- **Measured on the correct slide.** The first measurement was taken while the carousel had auto-rotated to the VBIF banner, so it reported the campaign slide's container rather than the hero's. Re-checked with the hero explicitly selected and rotation paused. Worth remembering when measuring anything inside this carousel: assert on the slide's `aria-label` first.

### Accomplishments
- [x] `lg:justify-center` on the hero `Container`, with a comment recording why it is needed.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Desktop (1638px): left and right gaps both **112px**, asymmetry **0px**, with the hero slide confirmed active.
- [x] Mobile (390px, via a same-origin iframe): logo centred at 84/84, slide heights still equal at 677/677, no horizontal overflow.

---

## 20260814 — Rosters sorted by first name

Branch `20260814/feature/sort-rosters`. All four rosters (61 players) now read alphabetically by first name.

### Decisions
- **Sorted at the data layer, not just in the file.** Sorting `content/teams.json` once would have looked identical today and quietly decayed: the next player added through `/admin` lands at the end of a `stringList` and would have sat out of order until someone noticed. `src/data/teams.ts` sorts on load, so the page is right regardless of how the JSON is ordered.
- **The stored file is sorted too, with the same comparator.** Not required by the code, but `/admin` shows the raw list — leaving the file unsorted while the site reordered it would make the editor and the page disagree, which is exactly the sort of thing that gets "fixed" by someone reordering the file by hand.
- **`localeCompare`, not `<`.** One player is "Ra’Leigh Hayes", with a typographic apostrophe (U+2019). Comparing by code point puts punctuation and any accented character in places a reader would not expect; `sensitivity: "base"` also keeps case out of it. Ties fall back to the full name so the order is stable.
- **First name, not surname** — as asked, and it is the right call for this audience: a parent scans a roster for a first name.
- **Updated the CMS help text**, which told editors to enter players "in the order the program lists them". That is now misleading; it says order does not matter and new players can be appended.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `validate:content` → 12 files OK; `next build` → 15 routes.
- [x] Parsed the four built roster pages and confirmed each renders in first-name order.
- [x] **Compared the roster sets against `HEAD` before the change**: 17/15/14/15 players, identical sets — nothing added, lost, or altered in the reorder.

### Not yet done
- [ ] Sorting is applied to rosters only. Coaches are still in program-published order, which is deliberate — that list is ranked by seniority, not alphabetised.

---

## 20260815 — Build credit in the footer

Branch `20260815/feature/footer-credit`. A subtle link to `codinci.com/about`, with the treatment left open.

### Decisions
- **Placed opposite the copyright in the existing bottom bar.** That row was already `flex … justify-between` with a single child, so it was shaped for a second item; the credit takes the right-hand side on desktop and stacks underneath on a phone. No new structure, and it reads last.
- **"Subtle" has a floor, and the first attempt was under it.** `text-white/35` looked right but measures **3.17:1** against the `#0d0d0d` footer — below the 4.5:1 WCAG AA minimum for body text. `white/45` is the quietest step that passes, at **4.52:1**, so that is what shipped. Subtlety comes from size, placement and reading order instead of from washing the text out.
- **No `target="_blank"`.** A link that opens a new window ought to say so (WCAG 3.2.5), and "(opens in a new tab)" beside a credit this small would shout louder than the credit. Same tab keeps it quiet and keeps the back button working.
- **A real link, not styled text.** Underline only on hover, colour shift to the brand gold — discoverable when looked for, invisible when not.
- **Hardcoded rather than added to `content/site.json`.** This is a developer credit, not something the Booster Club maintains; a CMS field for it would be noise in the editor.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Present on all 10 built pages — it is in the shared footer.
- [x] Contrast computed rather than eyeballed: 3.17:1 at `white/35` (fails), 4.52:1 at `white/45` (passes).
- [x] Keyboard reachable; not `target="_blank"`.
- [x] Mobile (390px): stacks below the copyright, centred within its container, no horizontal overflow.

### Not yet done
- [ ] Tap target is 16px tall — under the 24px of WCAG 2.5.8. Acceptable for a footer credit that nobody needs to hit, and enlarging it would work against the brief, but worth knowing it is a deliberate exception.

---

## 20260817 — Upcoming Events, actually live

Branch `20260817/feature/live-upcoming-events`. The landing page was advertising a tournament that had already finished, and "a dynamic way to render upcoming events" was asked for a second time — which is a fair signal that the first answer had not solved it.

### What was actually wrong
Not the filter, and not the cron. **The nightly rebuild has been firing every day and succeeding** — four scheduled runs on the 13th, 14th, 15th and 16th, all green. Production was showing "Aug 13–16 Tournament" on the morning of the 17th because it was last built at 11:40 UTC on the 16th, when that tournament was still current. Exactly the up-to-24-hours staleness recorded as an accepted cost on the 12th. Accepted costs stop being acceptable when someone notices them twice.

### Decisions
- **Filter twice: once at build, once in the browser.** The prerendered list stays — it is what crawlers and no-JS readers get, and it is never empty. On top of it, `UpcomingEventsList` re-runs the *same pure function* against the real date. `upcomingFrom(entries, today, limit)` takes the date as an argument precisely so both callers can share it; nothing is reimplemented client-side to drift out of step.
- **Initial state is the server's list.** That is what makes this safe: the first client render is identical to the prerendered HTML, so hydration matches and there is no flash in the common case where the build is current. The correction only happens when the build has actually gone stale.
- **`usePathname`-style caution paid off again.** No `useSearchParams`, no Suspense boundary, nothing that would put a fallback into the static HTML.
- **Re-checks on `visibilitychange`.** A phone left on a bedside table overnight would otherwise still show yesterday's list when picked up. Cheap to add, and it is the case a parent actually hits.
- **The date is computed in America/Chicago on both sides**, so a reader in another state sees the schedule relative to Klein Oak's day, not their own.
- **`programToday()` removed from `events.ts`** in favour of `programDate(now)` in `calendar.ts` — same logic, but parameterised so the browser can pass its own clock.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `next build` → 15 routes.
- [x] Prerendered list now opens on **Aug 18 Klein**, with the finished tournament gone.
- [x] **The client-side correction was proved, not assumed**: with the browser clock moved to 2026-09-10 and the tab foregrounded, the list re-rendered to Klein Cain / Tomball / Magnolia West / Klein Collins — all correctly future from that date.
- [x] No hydration warnings in the console on a clean reload.
- [x] 30 upcoming entries are handed to the client; the payload is the dates already in the page.

*A false negative worth recording: the first attempt at that test reported no change, and the code looked broken. The tab was being driven in the background, so `document.visibilityState` was `"hidden"` and the guard correctly refused to refresh. The test was wrong, not the component — worth checking `visibilityState` before believing any visibility-driven behaviour has failed under automation.*

### Not yet done
- [ ] **Every program milestone in `content/events.json` has now passed** — tryouts, rosters, first practice, Meet the Panthers, team pictures were all early August. "Upcoming Events" is now purely match play, running to 2026-11-21. If the program has further dates — senior night, a banquet, playoff watch parties — they need supplying; they cannot be invented.
- [ ] The Schedule page's "Program Dates" section now lists only past dates, for the same reason. Reads as a season-start record rather than a forward calendar.

---

## 20260817 — Varsity schedule reconciled against Rank One, and a results column

Branch `20260817/feature/varsity-results`. Source: the program's Rank One varsity calendar (`app.rankone.com/Schedules/View_Schedule_Web.aspx?…&Tm=18086`), which turned out to be plain server-rendered HTML — 39 rows, parseable without a browser.

### What the source actually said
Reconciling every date from Aug 13 onwards against Rank One, **the schedule was already right in all but two places**. Every district fixture — opponent, home/away, and start time — matched what had been transcribed from the program's published schedule on the 8th. Two corrections:

- **The Pearland tournament ends on the 15th, not the 16th.** Rank One lists nine varsity matches across Thursday–Saturday and nothing on Sunday. The row read `Aug 13–16 / Thursday – Sunday`.
- **The Legends Invitational has a time now.** All three days are 5:30 PM; the row said `TBD`.

Two apparent conflicts were checked and are not conflicts: the Houston Prime tournament (Aug 29) and the TAV Sub Varsity tournaments (Sep 3, Sep 5) are absent from the varsity feed because varsity is not playing them — already recorded as `x` in those rows.

### Decisions
- **The column is varsity-only, and says so.** Rank One publishes results per team and only the varsity calendar was given. Header reads "Varsity result" in the All view and "Result" when filtered to Varsity; the column is **hidden entirely** for JV, Flex and Freshman. An always-empty column would read as *their results are missing*, which is a different and untrue claim from *their results are not tracked here*.
- **Hidden in sections with no results at all.** District and Playoffs get no column until a result lands there, rather than 23 rows of dashes.
- **A blank is "no result posted" — explicitly.** It renders as a dash carrying `sr-only` text saying so. Silence would let a reader infer a loss or a cancellation from an empty cell.
- **The tournament is a record, not six cells.** Rank One lists the Pearland tournament as nine individual matches; the schedule keeps it as one dated block. `5–1` is the honest summary, and the qualification — that the three Saturday pool matches have no posted result — is in the note rather than hidden behind a tidy number.
- **Results were added for Aug 10 and 11 even though the date instruction said "from Aug 13 onwards".** That constraint was about not churning settled schedule rows; the results column instruction was not date-scoped. Leaving them blank would have shown three matches the team *won* (W 3–0, W 3–2, W 3–1) as having no result, which misrepresents the record. Their **times** were left alone, as those are schedule data and inside the excluded range.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `validate:content` → 12 files OK; `next build` → 15 routes.
- [x] Column behaviour driven in the browser across all five filter states: All → "Varsity result"; Varsity → "Result"; JV / Flex / Freshman → **no column**.
- [x] Four results render — `W 3–2`, `W 3–0`, `W 3–1`, `5–1` — and the badges were measured at 20px tall after a wrapping fix; they had been breaking across two lines in the narrow column.
- [x] `Aug 13–16` gone from the built page; `Aug 13–15 / Thursday – Saturday` in its place.

### Not yet done
- [ ] Results are transcribed by hand from Rank One, so they are a point-in-time copy. Nothing re-checks them, and nothing warns when a played fixture still has no result. Rank One remains the live source of truth.
- [ ] Aug 10 and Aug 11 varsity **times** are still `TBD` in the schedule although Rank One lists 4:30, 6:00 and 5:30 — deliberately untouched, being before the Aug 13 cutoff. A one-line change if wanted.
- [ ] Only varsity has results. JV, Flex and Freshman have their own Rank One team IDs; the same treatment would need those URLs and a per-level result model rather than one field.

---

## 20260818 — Ava Lockhardt added to Flex

Branch `20260818/content/flex-roster-addition`. Flex goes from 14 players to 15.

No code change was needed, which is the point: rosters are sorted by first name in `src/data/teams.ts`, so the name only had to exist. It renders second, between Addison Buescher and Bella Grant, and the player count on the page follows from `roster.length`. The stored JSON was re-sorted with the same comparator so `/admin` shows the page's order.

### Verified
- [x] `validate:content` → 12 files OK; `tsc` and `eslint` clean; `next build` → 15 routes.
- [x] Flex renders 15 names, still in first-name order, with the count badge reading 15.
- [x] Varsity 17, JV 15, Freshman 15 — unchanged, and the new name appears on no other roster.

### Not yet done
- [ ] This is a student's name on a public site. The schema's own guidance is to publish only a roster the program has already made public; the addition was requested rather than sourced, so it is worth confirming against the program's published Flex roster.

---

## 20260818 — Documentation: a reference that had eaten itself

Branch `20260818/docs/post-cutover-sources`. Routine documentation pass after the roster addition; the interesting find was not routine.

### The circular reference
`PROJECT-DOCUMENTATION.md` told a future maintainer to *"re-check rosters against the program's own page at kleinoakvolleyball.com"*. That instruction was written when the domain served the program's Wix site. **The domain now serves this site.** Following the instruction would have meant checking our data against our own output and concluding it was correct — the worst kind of verification, the sort that always passes.

The same framing had been copied into three data modules: `teams.ts` (twice), `matches.ts`, and `site.ts`. All four now say plainly that the original reference is gone, that **Rank One is the only remaining external source** — schedule, times, varsity results — and that **rosters have no external source at all** and can only be confirmed with the program.

That last point sharpens yesterday's roster addition: "Ava Lockhardt" cannot be checked against anything. There is no page to compare it to.

### Also
- Added `UpcomingEventsList.tsx`, `MatchSchedule.tsx` and `lib/asset.ts` to the Project Layout. The first is a client component the documentation already enumerates by name, and the third is referenced throughout the prose while being absent from the tree.
- The project log needed nothing — every merged PR through #25 already had an entry.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `validate:content` → 12 files OK; `next build` → 15 routes.
- [x] Every remaining mention of `kleinoakvolleyball.com` in the documentation now refers to it as *this site's address*, not as a source to check against.

### Not yet done
- [ ] Rosters are now unverifiable from outside. If the program publishes its rosters anywhere else — a team app, a printed programme, district pages — that source is worth recording, because right now the only check is asking a coach.

---

## 20260823 — A photo gallery, and a champion banner that leads to it

Branch `feat/photo-gallery`. 139 photos in five albums — Waller ISD Tournament (7), Varsity (38), Junior Varsity (33), Flex (26), Freshman (35) — at a new `/gallery` route, plus a third hero slide for the tournament win. Deployed to staging for review; **not** pushed to production.

### Decisions
- **Generated, not a CMS collection.** `content/gallery.json` is written by `scripts/build-gallery.mjs` and is deliberately absent from the schema, so `/admin` never shows it. Adding 139 photos one at a time through the editor would be miserable, and every field in the manifest — derivative paths, pixel dimensions — is a value an editor has no way to supply correctly. The trade is real and is recorded in Known Limitations: taking a photo down is now a developer job.
- **Two WebP derivatives per photo, because `public/` is what ships.** `images.unoptimized` is on for Pages, so whatever sits in `public/` is byte-for-byte what a visitor downloads. The drops were 36 MB of full-resolution JPEG; a ~600px grid thumbnail and a ~1400px lightbox copy come to 18 MB, and the grid then loads 600px files rather than 1024×1536 originals scaled down by the browser. Dimensions go into the manifest so the page reserves space and nothing reflows.
- **The originals are gitignored.** Only the generator reads `content/images/`, and neither a build nor a deploy touches it — committing it would have added 36 MB to this repo *and* to the production mirror permanently. The cost is that git is not a backup of the originals, which is now stated in `.gitignore`, in the documentation, and here.
- **The grid works with JavaScript off.** Every thumbnail is a real anchor to the full-size image, so scripting off degrades to the browser's own image view instead of an empty page. The album filter is radio inputs in a `<fieldset>`, the same pattern as `ScheduleBrowser`, and shows *every* album when nothing can change the selection — the useful fallback rather than the empty one.
- **The lightbox steps through the filtered set, not the library.** With Flex selected, "next" means the next Flex photo. It behaves as a dialog otherwise: focus trapped, Escape closes, arrows navigate, the page behind does not scroll, focus returns to the thumbnail that opened it.
- **Alt text says album and position, and stops there.** "Varsity — photo 12 of 38". Nobody has described these frames; inventing what is happening in them would be worse than admitting what is known, and `IMG_2604` is worse still. It is one function (`photoAlt`) so a person who was actually at the matches can fix every caller at once.
- **The whole champion banner is the link.** Someone reacting to "CHAMPIONS!" should not have to hunt for a small target, and a visible "See the photos" call to action keeps it reading as clickable rather than decorative. Its alt text carries the banner's own words — the artwork is an image of text (WCAG 1.4.5), so without that a screen-reader user gets nothing at all. That is the same flaw the VBIF banner still has, handled the other way.
- **The banner PNG became a 104 KB WebP.** 2.1 MB of source art would otherwise have been downloaded as-is on the home page.

### Verified
- [x] `tsc --noEmit` clean; `eslint` clean; `validate:content` → 12 files OK (the generated manifest is correctly invisible to it); `next build` → **16 routes**, up from 15.
- [x] Staging export built with `NEXT_PUBLIC_BASE_PATH=/kovb`: every gallery and banner `src` carries `/kovb`, and **zero** root-relative `/images…` sources remain in `out/index.html` or `out/gallery/index.html` — the failure mode `assetPath()` exists to prevent.
- [x] 278 derivatives (2 × 139) reached `out/images/gallery/`, and the same 278 landed in `kovb/`.
- [x] No analytics on staging: `grep -c googletagmanager out/index.html` → 0.
- [x] `.nojekyll` recreated after the sync, and the `--delete` dry run removed only a stale `_next` build-hash folder and two `.DS_Store` files.
- [x] Driven in a browser on `codinci.com/kovb/`, not just built: photos render, the filter reports "Showing 33 photos from Junior Varsity", the lightbox opens with "Waller ISD Tournament · 1 of 7", `→` advances to 2 of 7, Escape closes, and the champion banner's "See the photos" lands on `/gallery`.
- [x] 139 real `<a>` elements wrap the thumbnails — the JavaScript-off fallback is present in the served HTML, with hrefs like `/kovb/images/gallery/waller-isd-tournament/img-2604.webp` and alt text reading "Waller ISD Tournament — photo 1 of 7".
- [x] No broken images on the page.

### Not yet done
- [ ] **Production.** Staging only, pending review.
- [ ] **Consent is not modeled.** These are photographs of minors on a public site. Whether any given photo may be published is the program's call; nothing in the repository records who agreed, and the removal path is a developer running a script.
- [ ] Alt text is positional rather than descriptive, and only a person who was there can improve it.
- [ ] The originals exist in exactly one folder on one machine.
- [ ] Album titles and order live in two constants in the generator (`ALBUM_TITLES`, `ALBUM_ORDER`). A new folder works without touching them; renaming an album for display does not.
