/**
 * The only backend this CMS has: GitHub's REST API, called straight from the
 * editor's browser. No server, no database, no hosting bill.
 *
 * Writes go through the Git Data API (blob → tree → commit → ref) so that a
 * publish touching several files lands as ONE commit — one review, one build,
 * one deploy. The final ref update is a non-forced fast-forward, so if someone
 * else published while an editor was working, the update is rejected instead of
 * silently overwriting their work.
 */
import type { RepoTarget } from "./config";
import { base64ToUtf8, utf8ToBase64 } from "./encoding";

const apiRoot = "https://api.github.com";

export class GitHubError extends Error {
  status: number;
  documentationUrl?: string;

  constructor(status: number, message: string, documentationUrl?: string) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.documentationUrl = documentationUrl;
  }
}

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

export type RepoInfo = {
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  permissions?: { admin: boolean; maintain?: boolean; push: boolean; pull: boolean };
};

export type RepoFile = {
  path: string;
  /** Blob SHA of the version that was read — used to detect outside edits. */
  sha: string;
  text: string;
};

export type CommitInput = {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
};

export type CommitResult = {
  sha: string;
  htmlUrl: string;
  branch: string;
};

export type RecentCommit = {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorName: string;
  date: string;
  htmlUrl: string;
};

async function request<T>(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiRoot}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText;
    const docs =
      payload && typeof payload === "object" && "documentation_url" in payload
        ? String((payload as { documentation_url: unknown }).documentation_url)
        : undefined;
    throw new GitHubError(response.status, detail, docs);
  }

  return payload as T;
}

function repoPath(target: RepoTarget, suffix: string): string {
  return `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}${suffix}`;
}

export async function getUser(token: string): Promise<GitHubUser> {
  return request<GitHubUser>(token, "/user");
}

export async function getRepo(token: string, target: RepoTarget): Promise<RepoInfo> {
  return request<RepoInfo>(token, repoPath(target, ""));
}

/** Reads one text file at the configured branch. Returns null when missing. */
export async function readFile(
  token: string,
  target: RepoTarget,
  path: string,
): Promise<RepoFile | null> {
  try {
    const payload = await request<{ sha: string; content: string; encoding: string }>(
      token,
      repoPath(target, `/contents/${encodeContentPath(path)}?ref=${encodeURIComponent(target.branch)}`),
    );
    return {
      path,
      sha: payload.sha,
      text: payload.encoding === "base64" ? base64ToUtf8(payload.content) : payload.content,
    };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }
}

export async function readFiles(
  token: string,
  target: RepoTarget,
  paths: string[],
): Promise<Record<string, RepoFile | null>> {
  const results = await Promise.all(paths.map((path) => readFile(token, target, path)));
  return Object.fromEntries(paths.map((path, index) => [path, results[index]]));
}

function encodeContentPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function getBranchHead(token: string, target: RepoTarget, branch: string): Promise<string> {
  const ref = await request<{ object: { sha: string } }>(
    token,
    repoPath(target, `/git/ref/heads/${encodeURIComponent(branch)}`),
  );
  return ref.object.sha;
}

/**
 * Commits every file in one commit on `branch`.
 * Rejects (409) rather than overwriting if the branch moved in the meantime.
 */
export async function commitFiles(
  token: string,
  target: RepoTarget,
  options: { branch: string; message: string; files: CommitInput[] },
): Promise<CommitResult> {
  const headSha = await getBranchHead(token, target, options.branch);
  const headCommit = await request<{ tree: { sha: string } }>(
    token,
    repoPath(target, `/git/commits/${headSha}`),
  );

  const blobs = await Promise.all(
    options.files.map((file) =>
      request<{ sha: string }>(token, repoPath(target, "/git/blobs"), {
        method: "POST",
        body: { content: file.content, encoding: file.encoding },
      }),
    ),
  );

  const tree = await request<{ sha: string }>(token, repoPath(target, "/git/trees"), {
    method: "POST",
    body: {
      base_tree: headCommit.tree.sha,
      tree: options.files.map((file, index) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobs[index].sha,
      })),
    },
  });

  const commit = await request<{ sha: string; html_url: string }>(
    token,
    repoPath(target, "/git/commits"),
    { method: "POST", body: { message: options.message, tree: tree.sha, parents: [headSha] } },
  );

  await request(token, repoPath(target, `/git/refs/heads/${encodeURIComponent(options.branch)}`), {
    method: "PATCH",
    body: { sha: commit.sha, force: false },
  });

  return { sha: commit.sha, htmlUrl: commit.html_url, branch: options.branch };
}

export async function createBranch(
  token: string,
  target: RepoTarget,
  branch: string,
  fromBranch: string,
): Promise<void> {
  const sha = await getBranchHead(token, target, fromBranch);
  await request(token, repoPath(target, "/git/refs"), {
    method: "POST",
    body: { ref: `refs/heads/${branch}`, sha },
  });
}

export async function createPullRequest(
  token: string,
  target: RepoTarget,
  options: { head: string; base: string; title: string; body: string },
): Promise<{ number: number; htmlUrl: string }> {
  const pull = await request<{ number: number; html_url: string }>(
    token,
    repoPath(target, "/pulls"),
    { method: "POST", body: options },
  );
  return { number: pull.number, htmlUrl: pull.html_url };
}

export async function listRecentCommits(
  token: string,
  target: RepoTarget,
  options: { path?: string; perPage?: number } = {},
): Promise<RecentCommit[]> {
  const params = new URLSearchParams({
    sha: target.branch,
    per_page: String(options.perPage ?? 10),
  });
  if (options.path) params.set("path", options.path);

  const commits = await request<
    {
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } };
      author: { login: string } | null;
    }[]
  >(token, repoPath(target, `/commits?${params.toString()}`));

  return commits.map((entry) => ({
    sha: entry.sha,
    message: entry.commit.message.split("\n")[0],
    authorLogin: entry.author?.login ?? null,
    authorName: entry.commit.author.name,
    date: entry.commit.author.date,
    htmlUrl: entry.html_url,
  }));
}

/** True when the token can push to the repository (collaborator with write access). */
export function canPublish(repo: RepoInfo): boolean {
  return Boolean(repo.permissions?.push);
}

export function textFile(path: string, text: string): CommitInput {
  return { path, content: utf8ToBase64(text), encoding: "base64" };
}

export function binaryFile(path: string, base64: string): CommitInput {
  return { path, content: base64, encoding: "base64" };
}
