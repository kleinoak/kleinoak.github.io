/**
 * Where the CMS reads and writes content.
 *
 * Defaults are baked in at build time from environment variables (see
 * `.env.example`). An editor can point the admin at a different repository
 * from the sign-in screen — that override is stored in this browser only.
 */

export type RepoTarget = {
  owner: string;
  repo: string;
  branch: string;
};

export const defaultRepoTarget: RepoTarget = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || "alfredsilvertonai",
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || "ko-volleyball-web",
  branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main",
};

/** Directory (repo-relative) that uploaded images are committed into. */
export const mediaDir = "public/images/uploads";

/** Public URL prefix that maps to `mediaDir` once the site is built. */
export const mediaUrlPrefix = "/images/uploads";

/** Longest side, in pixels, that uploaded photos are resized down to. */
export const maxImageDimension = 1800;

/** Warn above this size (bytes) after resizing — the repo is not a photo host. */
export const imageSizeWarning = 1_500_000;

export const storageKeys = {
  token: "ko-cms.token",
  repo: "ko-cms.repo",
  drafts: "ko-cms.drafts",
  media: "ko-cms.media",
} as const;

/**
 * The fine-grained token page, pre-filtered to this repository's owner.
 * Editors still choose the repository and permissions themselves.
 */
export function tokenSetupUrl(): string {
  return "https://github.com/settings/personal-access-tokens/new";
}
