# Google Analytics — Setup Guide

How to get GA4 reporting on this site. **Steps marked 👤 are yours** (browser, Google account, repo settings). Steps marked 💻 are code changes — ask and they get written; nothing in the codebase does analytics today.

Read [Before you start](#before-you-start) first. This site is a high school program's site, and that changes two decisions.

---

## Before you start

**A Measurement ID is not a secret.** `G-XXXXXXXXXX` ships in the page source of every visitor's browser — it has to, that is how the tag works. Store it as a GitHub Actions **variable**, never a secret. The repo already uses this pattern for `SITE_BASE_PATH`.

**The site is a static export.** There is no server, so nothing can be logged server-side. All analytics run in the visitor's browser, which means:
- Ad blockers and browser tracking protection will block a meaningful share of hits. Expect GA to under-count. Do not reconcile GA numbers against anything and expect them to agree.
- The Measurement ID is **baked in at build time**, not read at runtime. Changing it requires a rebuild and redeploy, not just a settings change.

**There are two deployments today, and they will both send data.** `codinci.com/kovb/` (deployed by hand) and, after `GITHUB-PROD-SETUP.md`, the production site. If both use the same ID, your production reports include prototype traffic. Decide this before step 1 — see [Environments](#4--keep-prototype-traffic-out-of-production-reports).

---

## 1. 👤 Create the GA4 property

1. Go to <https://analytics.google.com> and sign in with the Google account that should **own** this data. Prefer a program/booster account over a personal one — whoever owns it controls access, and personal accounts leave with the person.
2. **Admin → Create → Property.**
   - Property name: `Klein Oak Volleyball`
   - Time zone: **(GMT-06:00) Central Time** — reports bucket by day in this zone; getting it wrong shifts every daily number.
   - Currency: US Dollar
3. Business details → objectives: pick anything, it only tunes default reports.
4. **Data collection → Web.** Website URL = your production URL (`https://kleinoak.github.io` or the custom domain). Stream name: `Production`.
5. Copy the **Measurement ID** — `G-` followed by 10 characters. This is the only value the site needs.

Leave **Enhanced measurement ON**. It gives you outbound clicks, file downloads (so the sponsorship-form PDF is tracked with no extra work), scroll depth, and site search, for free.

---

## 2. 👤 Privacy decisions — do these before any data is collected

This site is about **high school student athletes**, with names, photos, and rosters. Two settings are worth changing from Google's defaults, and one policy question is yours to answer.

**Turn Google Signals OFF.** *Admin → Data collection and modification → Data collection.* Signals links behavior to signed-in Google users' ad profiles, which is what you least want on a site whose audience is minors and their families. It is off by default on new properties — confirm it, do not assume.

**Turn ad personalization OFF.** *Admin → Data collection → Data collection settings*, and per-region if you prefer. You are measuring visits, not building ad audiences.

**Set data retention deliberately.** *Admin → Data retention.* Default is 2 months for user-level data; 14 months is the maximum. Aggregate reports are unaffected either way. Shorter is the defensible choice here.

**Never send personal data into GA.** Google's terms prohibit it and it would be a real problem on this site specifically. In practice: no student names, emails, or IDs in page titles, URLs, or event parameters. This is worth re-checking whenever a page is added.

**The policy question — you decide, I cannot:**
- **A cookie/consent banner.** GA4 sets cookies. Under GDPR/ePrivacy, EU visitors need consent *before* the tag fires. A Texas school program's EU traffic is usually negligible, and many similar sites accept that risk — but it is a risk, not an exemption. If the district has a policy, it wins.
- **A privacy notice on the site.** There is no privacy page today. If you want one, that is a page to write and a nav entry, and it should say plainly that the site uses Google Analytics and what that means.
- **Check with Klein ISD** whether the district has a position on analytics on program-affiliated sites. Cheaper to ask now than to unwind later.

---

## 3. 💻 Wire the tag into the site

Ask and this gets implemented. For reference, it is small:

**Add the dependency** — `@next/third-parties` is not currently installed:

```bash
npm install @next/third-parties
```

**Render the tag in `src/app/layout.tsx`**, guarded so builds without an ID stay clean:

```tsx
import { GoogleAnalytics } from "@next/third-parties/google";

// ...inside <body>, after {children}:
{process.env.NEXT_PUBLIC_GA_ID && (
  <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
)}
```

Two details that matter:

- **`process.env.NEXT_PUBLIC_GA_ID` must appear as that exact literal.** Next inlines these at build time by textual substitution; assigning it to a variable first, or building the name dynamically, silently produces `undefined`.
- **The guard is the point.** Local `npm run dev` and any build without the variable set simply render no tag, so development traffic never reaches your reports.

`GoogleAnalytics` handles App Router client-side navigations, which a raw `gtag` snippet does not — without it, only the first page of a visit is counted. Verify this in step 5 rather than trusting it.

**Add to `.env.example`** so the variable is discoverable:

```bash
# Google Analytics 4 Measurement ID. Public value, not a secret — it ships in
# the HTML. Leave empty to disable analytics entirely (dev, local builds).
NEXT_PUBLIC_GA_ID=
```

---

## 4. 👤 Keep prototype traffic out of production reports

Pick one. The first is cleaner and is what I would do:

**Separate properties (recommended).** Create a second GA4 property for the prototype, or simply leave `NEXT_PUBLIC_GA_ID` unset for the `codinci.com/kovb/` builds so the prototype reports nothing. Production data stays pristine with no filtering to maintain.

**One property, filter by hostname.** Keep both on one ID and create an internal-traffic filter. Cheaper to set up, but every report needs the filter applied correctly forever, and it is easy to forget one.

Whichever you choose, also add your own devices under *Admin → Data collection → Define internal traffic*, then set the **Internal Traffic** filter to **Active** (it defaults to Testing, which does nothing). Otherwise your own visits inflate a small site's numbers substantially.

---

## 5. 👤 Set the ID, deploy, and verify

**In the production repo:** Settings → Secrets and variables → **Actions → Variables → New repository variable**
- Name: `GA_MEASUREMENT_ID`
- Value: your `G-XXXXXXXXXX`

Then `deploy.yml` needs one line in the build step's `env:` block, next to the existing ones:

```yaml
NEXT_PUBLIC_GA_ID: ${{ vars.GA_MEASUREMENT_ID }}
```

**For the hand-deployed `codinci.com/kovb/` site:** that path never runs CI, so a repo variable does nothing for it. It reads whatever is in your shell or `.env.local` at build time. This is exactly how you would accidentally ship production analytics onto the prototype, or ship no analytics at all to production — worth being deliberate about.

**Verify — do not skip this:**
1. Deploy, then open the live site.
2. GA4 → **Reports → Realtime.** You should appear within ~30 seconds.
3. **Click between pages.** Realtime should show each page path. If only the landing page ever appears, the App Router navigation tracking is not working and needs fixing.
4. **Click the sponsorship form PDF.** Enhanced measurement should log a `file_download` event.
5. View source on the live page and confirm the `G-` ID is the one you intended — this catches an environment mix-up immediately.

Use **Admin → DebugView** with the GA Debugger extension if something is not arriving; it shows individual events as they land.

**Data takes ~24–48 hours to appear in standard reports.** Realtime is immediate; everything else is not. Do not conclude it is broken on day one.

---

## What you get, and what you do not

**You get:** visitors, sessions, most-viewed pages, traffic sources, device and browser mix, geography, outbound clicks, PDF downloads, scroll depth.

**You do not get:** anything about *who* an individual visitor is (by design), accurate absolute counts (ad blockers), or any historical data from before setup — GA cannot backfill.

For a site this size, the numbers worth watching are which pages parents actually use, whether the schedule gets traffic on game days, and whether the sponsorship form gets downloaded — that last one is the number a sponsor conversation can be built on.
