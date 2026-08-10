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
