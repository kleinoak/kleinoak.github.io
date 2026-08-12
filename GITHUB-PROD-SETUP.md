# Production Deployment — `kleinoak` Setup Guide

Standing up <https://github.com/kleinoak> as the production home for this site. **Steps marked 👤 are yours** (GitHub UI, DNS, local machine). Steps marked 💻 are code changes.

Work through it in order — [step 1](#1--decide-the-repository-name) determines values used by later steps.

---

## What is true today

Checked, not assumed:

| | |
|---|---|
| `github.com/kleinoak` | Exists. **User account**, not an Organization. Created 2026-08-12, 0 public repos. |
| Current source | `alfredsilvertonai/ko-volleyball-web` |
| Current deploy | Hand-copied to `thecodinci/thecodinci.github.io` → `codinci.com/kovb/` |
| CI | `.github/workflows/deploy.yml` already builds and deploys to Pages on every push to `main`. **It works as-is on a new repo** — nothing in it is hardcoded to the current owner. |

**`kleinoak` being a User and not an Organization is the one structural thing worth reconsidering.** A User account means: no teams, no org-level roles, no org secrets, and access is per-repository collaborators. Most importantly, **whoever holds that account's password owns production** — if it is tied to one volunteer's email, the program loses the site when that person moves on. An Organization (free, and it can own the same repos) separates ownership from any individual and lets you hand over admin cleanly. Converting a User to an Organization is possible but disruptive; doing it now, with 0 repos, costs nothing.

If you keep the User account, at minimum put it on a program-owned email address with recovery codes stored somewhere the board can reach.

---

## 1. 👤 Decide the repository name

This determines the site URL and one build setting. Pick before creating anything.

**Option A — `kleinoak/kleinoak.github.io` (recommended)**
- URL: `https://kleinoak.github.io/`
- `SITE_BASE_PATH`: **leave unset**
- Served from the domain root, so every asset path resolves without a prefix. This is the configuration with the fewest ways to go wrong, and it maps cleanly onto a custom domain later.

**Option B — `kleinoak/ko-volleyball-web` (or any other name)**
- URL: `https://kleinoak.github.io/ko-volleyball-web/`
- `SITE_BASE_PATH`: `/ko-volleyball-web`
- Everything still works, but every image, PDF, and script must carry the prefix. This project has already been bitten by that twice (PR #3, and the `.nojekyll` incident) — it is a live footgun, not a theoretical one.

Take Option A unless you have a reason to want other repos on the same Pages domain.

---

## 2. 👤 Set up local access to the new account

Follow the conventions already in `~/Workspace/INSTRUCTIONS.md` so this account behaves like the other four.

```bash
# 1. Key for the new account
ssh-keygen -t ed25519 -C "kleinoak" -f ~/.ssh/id_ed25519_kleinoak

# 2. Add the PUBLIC key at github.com/settings/keys (signed in as kleinoak)
cat ~/.ssh/id_ed25519_kleinoak.pub

# 3. Host alias in ~/.ssh/config
#    Host github.com-kleinoak
#      HostName github.com
#      User git
#      IdentityFile ~/.ssh/id_ed25519_kleinoak
#      IdentitiesOnly yes

# 4. Verify — should greet you as kleinoak, not another account
ssh -T git@github.com-kleinoak
```

If you want folder-based identity like the others, create `~/Workspace/prod/` with a `.gitconfig-account`, and add a matching `includeIf` to `~/.gitconfig`.

**Remember `gh` will not follow any of this** — it is authenticated as `bschwarzchild` and ignores SSH aliases entirely. Every step below that says "in the GitHub UI" is deliberate; `gh` will not work against these repos without `gh auth login` first. See `INSTRUCTIONS.md` §2b.

---

## 3. 👤 Create the repository and push

Create it empty at <https://github.com/new> signed in as `kleinoak` — **no** README, `.gitignore`, or license, so the first push is clean.

Then, from the existing working copy:

```bash
cd ~/Workspace/play/ko-volleyball-web
git remote add prod git@github.com-kleinoak:kleinoak/kleinoak.github.io.git
git push prod main
```

This keeps `origin` pointing at the current repo, so nothing about your existing workflow changes. **Decide whether production should be a fork of the prototype's history or a fresh start** — the command above carries the full history across, including every prototype-era commit. That is usually what you want (blame and history survive); say so if you would rather start clean.

---

## 4. 👤 Turn on Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Not "Deploy from a branch" — the workflow uploads an artifact, and the branch-based mode will ignore it and serve nothing.

Then push once (or **Actions → Build and deploy site → Run workflow**) and watch it go green.

---

## 5. 👤 Repository variables

**Settings → Secrets and variables → Actions → Variables.**

| Variable | Value | When |
|---|---|---|
| `SITE_BASE_PATH` | `/ko-volleyball-web` | **Only** if you chose Option B. Leave unset for Option A. |
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | When you do `GOOGLE-ANALYTICS-SETUP.md`. |

Both are variables, not secrets — they ship in the built HTML either way.

**The CMS needs no configuration here.** `deploy.yml` already derives it from the repository it is running in:

```yaml
NEXT_PUBLIC_GITHUB_OWNER: ${{ github.repository_owner }}
NEXT_PUBLIC_GITHUB_REPO:  ${{ github.event.repository.name }}
```

So a CI build in the new repo automatically produces an `/admin` that reads and writes the new repo. **A local `npm run build` does not** — `src/cms/config.ts` falls back to `alfredsilvertonai` / `ko-volleyball-web`. If you ever hand-deploy a production build, create `.env.local` with the right owner and repo first, or you will ship an admin panel that quietly edits the prototype repo.

---

## 6. 👤 Custom domain (optional, but decide now)

If production should live at a real domain rather than `kleinoak.github.io`:

1. **Settings → Pages → Custom domain** → enter it → Save. GitHub writes a `CNAME` file to the repo.
2. At your DNS provider:
   - Subdomain (`volleyball.example.org`): `CNAME` → `kleinoak.github.io`
   - Apex (`example.org`): four `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Wait for the DNS check to pass, then tick **Enforce HTTPS**.

With a custom domain the site is at the root, so `SITE_BASE_PATH` stays unset regardless of repo name.

**Do not point `kleinoakvolleyball.com` at this until the program has decided to switch.** That domain currently serves the live Wix site; repointing DNS *is* the cutover, and it is not reversible within the TTL window.

---

## 7. 👤 Give editors access

**Settings → Collaborators → Add people**, with **Write**. Write is the level `/admin` checks for — it refuses to publish otherwise, with an explanation.

Each editor then needs their **own** fine-grained personal access token, scoped to the **new** repo:
- <https://github.com/settings/personal-access-tokens/new>
- Repository access: only `kleinoak/kleinoak.github.io`
- Permissions: **Contents: Read and write** — nothing else
- Set an expiry and diarise the renewal

**Existing tokens will not work.** They are scoped per repository, so every editor re-issues one after the move. Expect this to be the step that generates support questions.

---

## 8. 💻 Production readiness — the site still says "Prototype"

These are in the code right now and will ship to production as-is. Every one is verified, with its location:

| What | Where | Effect |
|---|---|---|
| Every page title reads "Klein Oak Volleyball **(Prototype)**" | `src/app/layout.tsx:23-24` | Browser tabs, search results, social shares |
| Meta description: "A local modernization **prototype**…" | `src/app/layout.tsx:27` | Google's snippet for the whole site |
| "…have not been invented for this **prototype**" | `src/app/(site)/coaches/page.tsx:36` | Visible body text |
| Screen-reader text "(prototype messaging)" | `src/components/home/Hero.tsx:46` | Announced to screen-reader users |
| `taglineIsPrototypeCopy: true` | `content/site.json:6` | Tagline is invented copy, not the program's |
| `spirit-wear` marked unverified | `content/resources.json` | Renders with a caution note |

The tagline flag is the one needing a **decision, not a code change**: "Compete Together. Grow Together. Win Together." was written for the prototype and is not the program's real tagline. Either the program adopts it, or supplies the real one, or it comes out.

Say the word and the mechanical ones get fixed in a single pass.

---

## 9. 👤 Protect `main` (recommended)

**Settings → Rules → Rulesets → New branch ruleset**, targeting `main`:
- Require a pull request before merging
- Require status checks: the `check` job from `pull-request.yml`

Note the trade-off: this **disables the "Publish now" mode in `/admin`**, because that mode commits straight to `main`. Editors would use "Ask for review first" exclusively, and someone has to be available to merge. For a small volunteer group that is often the wrong trade — a schedule correction stuck behind an unavailable reviewer is worse than an unreviewed schedule correction. Decide based on how many editors you actually have.

---

## 10. 👤 Decide what the old environments become

You will have three deployments. Name their roles explicitly or they drift:

| Deployment | Suggested role |
|---|---|
| `kleinoak.github.io` | **Production.** Auto-deploys from `main` via CI. |
| `codinci.com/kovb/` | **Staging.** Hand-deployed, useful for showing the board a change before it is live. Set no `GA_MEASUREMENT_ID` here. |
| `alfredsilvertonai/ko-volleyball-web` | **Development source.** Where the work happens. |

The open question is which repo becomes the source of truth. Two repos both accepting `/admin` publishes will diverge, and merging content JSON by hand is miserable. Pick one — most likely production — and make the other a mirror.

---

## Order of operations

1. Decide User vs Organization (§ "What is true today")
2. Decide repo name (§1)
3. SSH access (§2)
4. Create repo, push (§3)
5. Pages on (§4)
6. Variables (§5)
7. Confirm the site loads at `kleinoak.github.io` **before** touching DNS
8. Production readiness pass (§8)
9. Editors and tokens (§7)
10. Custom domain last (§6)

Getting §7 confirmed working before §6 means that if DNS misbehaves you are debugging one thing, not two.
