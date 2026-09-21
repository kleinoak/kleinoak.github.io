#!/bin/sh
# Publish the built site to staging: the `kovb/` folder of thecodinci.github.io.
#
# Usage:  sh scripts/deploy-staging.sh
#
# WHY THIS IS NOT deploy-prod.sh WITH A DIFFERENT REMOTE
#
# Production is a whole repository that exists only to serve this site, so
# `deploy-prod.sh` force-pushes a tree over it and calls the history a
# deployment artefact. Staging is a *folder inside somebody's personal site* —
# thecodinci.github.io also serves its own index.html, about/ and images/ from
# the same branch. A force-push there would delete all of it.
#
# So this script does the opposite of the production one in every way that
# matters: it never rewrites history, it commits rather than pushes a
# constructed tree, and every path it touches is under `kovb/`.
#
# WHAT STAGING IS
#
# Built output only, no source, no Pages workflow of its own — the folder is
# served as static files by the parent site. Two things therefore have to be
# right at build time and cannot be fixed afterwards:
#
#   * NEXT_PUBLIC_BASE_PATH=/kovb, because it is served from a sub-path. Without
#     it every asset resolves against the domain root and the page loads
#     unstyled.
#   * No GA id, so staging cannot pollute production's analytics. This is by
#     construction: with the variable unset the tag is not rendered at all,
#     which is stronger than filtering the traffic out later.
#
# Nothing else is passed to the build, which makes the tree this produces
# byte-identical to the documented by-hand build in PROJECT-DOCUMENTATION,
# "Deploying to staging". Keep it that way: an env var added here and not there
# is a difference nobody will notice until staging behaves unlike the thing it
# is meant to preview.
set -eu

STAGING_REMOTE=${STAGING_REMOTE:-git@github.com:thecodinci/thecodinci.github.io.git}
STAGING_BRANCH=${STAGING_BRANCH:-main}
SUBDIR=kovb

SOURCE_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$SOURCE_DIR"

# In CI there is no clone to reuse, so make one and throw it away. Locally,
# point STAGING_REPO_DIR at the working copy you already have and the commit
# lands there for you to inspect before it goes anywhere.
CLONED=no
if [ -n "${STAGING_REPO_DIR:-}" ]; then
  if [ ! -d "$STAGING_REPO_DIR/.git" ]; then
    echo "✗ STAGING_REPO_DIR=$STAGING_REPO_DIR is not a git repository." >&2
    exit 1
  fi
  echo "Using existing staging checkout: $STAGING_REPO_DIR"
else
  STAGING_REPO_DIR=$(mktemp -d "${TMPDIR:-/tmp}/ko-staging.XXXXXX")
  CLONED=yes
  trap 'rm -rf "$STAGING_REPO_DIR"' EXIT
  echo "Cloning staging into $STAGING_REPO_DIR"
  git clone -q --depth 1 --branch "$STAGING_BRANCH" "$STAGING_REMOTE" "$STAGING_REPO_DIR"
fi

if [ ! -d "$STAGING_REPO_DIR/$SUBDIR" ]; then
  echo "✗ $STAGING_REPO_DIR has no $SUBDIR/ — is this really the staging repo?" >&2
  exit 1
fi

# Refuse to publish work that is not in the repository. Staging carries built
# output with no source next to it, so a tree built from uncommitted edits is
# unattributable once it is there: nothing in either repository records what it
# was built from.
#
# Markdown is exempt, which `deploy-prod.sh` is not. No .md file feeds the site
# — content/ is entirely JSON — so a docs edit cannot change the built tree,
# and IDLC.md in particular is half-written most of the time. A check that a
# human has to bypass to do an ordinary deploy stops being a check.
if [ -n "$(git status --porcelain -- ':!*.md')" ]; then
  echo "✗ Working tree is not clean. Commit or stash first." >&2
  exit 1
fi

SOURCE_SHA=$(git rev-parse HEAD)
SOURCE_SHORT=$(git rev-parse --short HEAD)

echo "Building $SOURCE_SHORT for /$SUBDIR"
rm -rf out .next
NEXT_PUBLIC_BASE_PATH="/$SUBDIR" npm run build

# Recreated on every deploy, never committed to the source repo's public/. It
# does not exist in out/ until this line, and `rsync --delete` removes the one
# already on staging — so skipping this silently reinstates Jekyll, which
# ignores any directory beginning with an underscore and 404s all of _next/.
touch out/.nojekyll

# Assert what the two build-time requirements above were for, because both fail
# quietly: the site renders, it is simply unstyled or silently reporting to
# production's analytics property.
if [ "$(grep -c '"/'"$SUBDIR"'/_next/' out/index.html)" -eq 0 ]; then
  echo "✗ Built assets do not carry the /$SUBDIR base path." >&2
  exit 1
fi
if grep -q 'googletagmanager' out/index.html; then
  echo "✗ An analytics tag was rendered. Staging must emit none." >&2
  exit 1
fi

echo "Syncing into $SUBDIR/"
# --delete is what keeps staging a copy rather than an accumulation, and it is
# also the dangerous flag: scoped to out/ → kovb/ it can only ever remove things
# under kovb/, which is the whole reason this script never operates on the
# repository root. .DS_Store is excluded so a Finder visit on either side does
# not show up as a deploy.
rsync -a --delete --exclude='.DS_Store' out/ "$STAGING_REPO_DIR/$SUBDIR/"

cd "$STAGING_REPO_DIR"

# Only ever this folder. If a future change starts touching the parent site,
# this is the line that should have stopped it.
git add -- "$SUBDIR"

if git diff --cached --quiet; then
  echo "✓ Staging already matches $SOURCE_SHORT — nothing to publish."
  exit 0
fi

if [ -z "$(git config user.email || true)" ]; then
  git config user.name  "rankone-sync[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
fi

git commit -q -m "Deploy kovb: staging rebuilt from $SOURCE_SHORT

Built output only, from ko-volleyball-web@$SOURCE_SHA with
NEXT_PUBLIC_BASE_PATH=/$SUBDIR and no analytics id.

Generated by scripts/deploy-staging.sh. Staging carries no source, so
this message is the only record of what it was built from."

# Someone may have pushed to the parent site between the clone and now — it is
# a personal site with its own unrelated commits. Rebase rather than fail; this
# folder is generated output and nothing else in the repository touches it.
git pull -q --rebase "$STAGING_REMOTE" "$STAGING_BRANCH" || true
git push -q "$STAGING_REMOTE" "HEAD:$STAGING_BRANCH"

echo "✓ Pushed staging rebuilt from $SOURCE_SHORT to $STAGING_BRANCH."
if [ "$CLONED" = no ]; then
  echo "  Your checkout at $STAGING_REPO_DIR now has that commit."
fi
