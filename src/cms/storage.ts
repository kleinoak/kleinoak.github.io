/**
 * Browser-side persistence: the editor's token, the repository they are
 * pointed at, and any unpublished drafts. Nothing here ever leaves the
 * browser except through an explicit publish.
 */
import { defaultRepoTarget, storageKeys, type RepoTarget } from "./config";

export type Draft = {
  data: unknown;
  /** Blob SHA the draft was started from — lets us spot outside edits. */
  baseSha: string;
  updatedAt: string;
};

export type DraftStore = Record<string, Draft>;

/** Uploaded-but-not-yet-published images, keyed by their repo path. */
export type MediaStore = Record<string, string>;

function readJson<T>(storage: Storage | null, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function local(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function session(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function loadToken(): string | null {
  return session()?.getItem(storageKeys.token) ?? local()?.getItem(storageKeys.token) ?? null;
}

export function saveToken(token: string, remember: boolean): void {
  clearToken();
  const storage = remember ? local() : session();
  storage?.setItem(storageKeys.token, token);
}

export function isTokenRemembered(): boolean {
  return Boolean(local()?.getItem(storageKeys.token));
}

export function clearToken(): void {
  session()?.removeItem(storageKeys.token);
  local()?.removeItem(storageKeys.token);
}

export function loadRepoTarget(): RepoTarget {
  const override = readJson<Partial<RepoTarget>>(local(), storageKeys.repo, {});
  return {
    owner: override.owner || defaultRepoTarget.owner,
    repo: override.repo || defaultRepoTarget.repo,
    branch: override.branch || defaultRepoTarget.branch,
  };
}

export function saveRepoTarget(target: RepoTarget): void {
  local()?.setItem(storageKeys.repo, JSON.stringify(target));
}

export function resetRepoTarget(): void {
  local()?.removeItem(storageKeys.repo);
}

export function loadDrafts(): DraftStore {
  return readJson<DraftStore>(local(), storageKeys.drafts, {});
}

export function saveDrafts(drafts: DraftStore): void {
  local()?.setItem(storageKeys.drafts, JSON.stringify(drafts));
}

export function loadMedia(): MediaStore {
  return readJson<MediaStore>(local(), storageKeys.media, {});
}

/**
 * Pending images can be large; browsers cap local storage around 5 MB.
 * Returns false when the images could only be kept in memory for this tab.
 */
export function saveMedia(media: MediaStore): boolean {
  try {
    local()?.setItem(storageKeys.media, JSON.stringify(media));
    return true;
  } catch {
    return false;
  }
}

export function clearWorkInProgress(): void {
  local()?.removeItem(storageKeys.drafts);
  local()?.removeItem(storageKeys.media);
}
