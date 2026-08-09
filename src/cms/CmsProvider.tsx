"use client";

/**
 * Everything the editor knows: who is signed in, what the published content
 * looks like, what the editor has changed but not yet published, and how to
 * turn those changes into a commit.
 *
 * All of it runs in the browser. The "server" is GitHub.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultRepoTarget, type RepoTarget } from "./config";
import {
  GitHubError,
  binaryFile,
  canPublish,
  commitFiles,
  createBranch,
  createPullRequest,
  getRepo,
  getUser,
  listRecentCommits,
  readFiles,
  textFile,
  type CommitInput,
  type GitHubUser,
  type RecentCommit,
  type RepoInfo,
} from "./github";
import { collections, getCollection, type Collection } from "./schema";
import {
  clearToken,
  clearWorkInProgress,
  isTokenRemembered,
  loadDrafts,
  loadMedia,
  loadRepoTarget,
  loadToken,
  resetRepoTarget,
  saveDrafts,
  saveMedia,
  saveRepoTarget,
  saveToken,
  type MediaStore,
} from "./storage";
import { normalize, serialize, validateCollectionData, type Issue } from "./validation";
import { describeChanges, summarizeChanges, type ChangeSummary } from "./changes";

export type CollectionState = {
  /** Content as currently published on the branch. */
  baseline: unknown;
  /** Blob SHA of that published version. */
  sha: string;
  /** What the editor is working on (identical to baseline when untouched). */
  draft: unknown;
  /** The published file changed after this draft was started. */
  stale: boolean;
};

export type PublishMode = "direct" | "propose";

export type PublishOutcome = {
  mode: PublishMode;
  commitUrl: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
};

type Status = "signed-out" | "connecting" | "ready";

type CmsValue = {
  status: Status;
  error: string | null;
  target: RepoTarget;
  user: GitHubUser | null;
  repo: RepoInfo | null;
  files: Record<string, CollectionState>;
  media: MediaStore;
  mediaPersisted: boolean;
  recentCommits: RecentCommit[];
  dirtyCollections: Collection[];
  summaries: ChangeSummary[];
  defaultMessage: string;
  busy: boolean;
  signIn: (token: string, remember: boolean, target: RepoTarget) => Promise<void>;
  signOut: () => void;
  reload: () => Promise<void>;
  updateDraft: (collectionName: string, data: unknown) => void;
  revertDraft: (collectionName: string) => void;
  discardEverything: () => void;
  addMedia: (path: string, base64: string) => void;
  issuesFor: (collectionName: string) => Issue[];
  publish: (options: { message: string; mode: PublishMode }) => Promise<PublishOutcome>;
};

const CmsContext = createContext<CmsValue | null>(null);

export function useCms(): CmsValue {
  const value = useContext(CmsContext);
  if (!value) throw new Error("useCms must be used inside <CmsProvider>");
  return value;
}

function describeGitHubError(error: unknown, target: RepoTarget): string {
  if (error instanceof GitHubError) {
    if (error.status === 401) {
      return "GitHub did not accept that token. Check that it was copied completely and has not expired.";
    }
    if (error.status === 403) {
      return `GitHub refused the request (${error.message}). The token may be missing "Contents: Read and write" permission for ${target.owner}/${target.repo}.`;
    }
    if (error.status === 404) {
      return `Could not find ${target.owner}/${target.repo}. Check the repository name, and that the token was granted access to that repository.`;
    }
    if (error.status === 409 || error.status === 422) {
      return `GitHub rejected the update: ${error.message}. Someone else may have published while you were editing — reload the latest content and try again.`;
    }
    return `GitHub error ${error.status}: ${error.message}`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("signed-out");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [target, setTarget] = useState<RepoTarget>(defaultRepoTarget);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [files, setFiles] = useState<Record<string, CollectionState>>({});
  const [media, setMedia] = useState<MediaStore>({});
  const [mediaPersisted, setMediaPersisted] = useState(true);
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([]);

  const loadContent = useCallback(
    async (activeToken: string, activeTarget: RepoTarget) => {
      const paths = collections.map((collection) => collection.file);
      const loaded = await readFiles(activeToken, activeTarget, paths);

      const missing = paths.filter((path) => !loaded[path]);
      if (missing.length) {
        throw new Error(
          `These content files are missing from ${activeTarget.owner}/${activeTarget.repo} (${activeTarget.branch}): ${missing.join(", ")}`,
        );
      }

      const drafts = loadDrafts();
      const next: Record<string, CollectionState> = {};
      for (const collection of collections) {
        const file = loaded[collection.file]!;
        const baseline = JSON.parse(file.text) as unknown;
        const draft = drafts[collection.name];
        const usable = draft && JSON.stringify(draft.data) !== JSON.stringify(baseline);
        next[collection.name] = {
          baseline,
          sha: file.sha,
          draft: usable ? draft.data : baseline,
          stale: Boolean(usable && draft.baseSha !== file.sha),
        };
      }
      setFiles(next);
      setMedia(loadMedia());

      listRecentCommits(activeToken, activeTarget, { path: "content", perPage: 8 })
        .then(setRecentCommits)
        .catch(() => setRecentCommits([]));
    },
    [],
  );

  const signIn = useCallback(
    async (nextToken: string, remember: boolean, nextTarget: RepoTarget) => {
      setBusy(true);
      setError(null);
      setStatus("connecting");
      try {
        const account = await getUser(nextToken);
        const repository = await getRepo(nextToken, nextTarget);
        if (!canPublish(repository)) {
          throw new Error(
            `${account.login} can read ${nextTarget.owner}/${nextTarget.repo} but cannot write to it. Ask the site administrator to invite you as a collaborator with Write access.`,
          );
        }
        await loadContent(nextToken, nextTarget);

        setToken(nextToken);
        setUser(account);
        setRepo(repository);
        setTarget(nextTarget);
        saveToken(nextToken, remember);
        saveRepoTarget(nextTarget);
        setStatus("ready");
      } catch (caught) {
        setError(describeGitHubError(caught, nextTarget));
        setStatus("signed-out");
      } finally {
        setBusy(false);
      }
    },
    [loadContent],
  );

  // Restore a remembered session (and any repository override) on first paint.
  useEffect(() => {
    const restore = async () => {
      const storedTarget = loadRepoTarget();
      const storedToken = loadToken();
      if (storedToken) {
        await signIn(storedToken, isTokenRemembered(), storedTarget);
      } else {
        setTarget(storedTarget);
      }
    };
    void restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setRepo(null);
    setFiles({});
    setRecentCommits([]);
    setStatus("signed-out");
    setError(null);
  }, []);

  const reload = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await loadContent(token, target);
    } catch (caught) {
      setError(describeGitHubError(caught, target));
    } finally {
      setBusy(false);
    }
  }, [loadContent, target, token]);

  const persistDrafts = useCallback((next: Record<string, CollectionState>) => {
    const drafts: Record<string, { data: unknown; baseSha: string; updatedAt: string }> = {};
    for (const [name, state] of Object.entries(next)) {
      if (JSON.stringify(state.draft) !== JSON.stringify(state.baseline)) {
        drafts[name] = { data: state.draft, baseSha: state.sha, updatedAt: new Date().toISOString() };
      }
    }
    saveDrafts(drafts);
  }, []);

  const updateDraft = useCallback(
    (collectionName: string, data: unknown) => {
      setFiles((current) => {
        const state = current[collectionName];
        if (!state) return current;
        const next = { ...current, [collectionName]: { ...state, draft: data } };
        persistDrafts(next);
        return next;
      });
    },
    [persistDrafts],
  );

  const revertDraft = useCallback(
    (collectionName: string) => {
      setFiles((current) => {
        const state = current[collectionName];
        if (!state) return current;
        const next = {
          ...current,
          [collectionName]: { ...state, draft: state.baseline, stale: false },
        };
        persistDrafts(next);
        return next;
      });
    },
    [persistDrafts],
  );

  const discardEverything = useCallback(() => {
    setFiles((current) => {
      const next: Record<string, CollectionState> = {};
      for (const [name, state] of Object.entries(current)) {
        next[name] = { ...state, draft: state.baseline, stale: false };
      }
      return next;
    });
    setMedia({});
    clearWorkInProgress();
  }, []);

  const addMedia = useCallback((path: string, base64: string) => {
    setMedia((current) => {
      const next = { ...current, [path]: base64 };
      setMediaPersisted(saveMedia(next));
      return next;
    });
  }, []);

  const dirtyCollections = useMemo(
    () =>
      collections.filter((collection) => {
        const state = files[collection.name];
        return state && JSON.stringify(state.draft) !== JSON.stringify(state.baseline);
      }),
    [files],
  );

  const summaries = useMemo(
    () =>
      dirtyCollections.map((collection) =>
        summarizeChanges(collection, files[collection.name].baseline, files[collection.name].draft),
      ),
    [dirtyCollections, files],
  );

  const defaultMessage = useMemo(() => describeChanges(summaries), [summaries]);

  const issuesFor = useCallback(
    (collectionName: string): Issue[] => {
      const collection = getCollection(collectionName);
      const state = files[collectionName];
      if (!collection || !state) return [];
      return validateCollectionData(collection, state.draft);
    },
    [files],
  );

  const publish = useCallback(
    async ({ message, mode }: { message: string; mode: PublishMode }): Promise<PublishOutcome> => {
      if (!token || !user) throw new Error("Not signed in.");
      if (!dirtyCollections.length) throw new Error("There is nothing to publish.");

      const blocking = dirtyCollections.flatMap((collection) =>
        validateCollectionData(collection, files[collection.name].draft).map(
          (issue) => `${collection.label}: ${issue.message}`,
        ),
      );
      if (blocking.length) {
        throw new Error(`Fix these before publishing —\n${blocking.join("\n")}`);
      }

      const commitInputs: CommitInput[] = dirtyCollections.map((collection) =>
        textFile(
          collection.file,
          serialize(normalize(collection, files[collection.name].draft)),
        ),
      );

      // Only ship images that the edited content actually references.
      const referenced = JSON.stringify(dirtyCollections.map((c) => files[c.name].draft));
      for (const [path, base64] of Object.entries(media)) {
        const publicPath = path.replace(/^public/, "");
        if (referenced.includes(publicPath)) commitInputs.push(binaryFile(path, base64));
      }

      setBusy(true);
      try {
        if (mode === "direct") {
          const commit = await commitFiles(token, target, {
            branch: target.branch,
            message,
            files: commitInputs,
          });
          clearWorkInProgress();
          setMedia({});
          await loadContent(token, target);
          return { mode, commitUrl: commit.htmlUrl };
        }

        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
        const branch = `cms/${user.login}-${stamp}`;
        await createBranch(token, target, branch, target.branch);
        const commit = await commitFiles(token, target, { branch, message, files: commitInputs });
        const pull = await createPullRequest(token, target, {
          head: branch,
          base: target.branch,
          title: message,
          body: pullRequestBody(summaries, user.login),
        });
        clearWorkInProgress();
        setMedia({});
        await loadContent(token, target);
        return {
          mode,
          commitUrl: commit.htmlUrl,
          pullRequestUrl: pull.htmlUrl,
          pullRequestNumber: pull.number,
        };
      } finally {
        setBusy(false);
      }
    },
    [dirtyCollections, files, loadContent, media, summaries, target, token, user],
  );

  const value: CmsValue = {
    status,
    error,
    target,
    user,
    repo,
    files,
    media,
    mediaPersisted,
    recentCommits,
    dirtyCollections,
    summaries,
    defaultMessage,
    busy,
    signIn,
    signOut,
    reload,
    updateDraft,
    revertDraft,
    discardEverything,
    addMedia,
    issuesFor,
    publish,
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function forgetRepoOverride(): void {
  resetRepoTarget();
}

function pullRequestBody(summaries: ChangeSummary[], login: string): string {
  const lines = [`Content changes proposed by @${login} from the website editor (/admin).`, ""];
  for (const summary of summaries) {
    if (summary.empty) continue;
    lines.push(`### ${summary.collection.label} — \`${summary.collection.file}\``);
    for (const label of summary.added) lines.push(`- Added: **${label}**`);
    for (const label of summary.removed) lines.push(`- Removed: **${label}**`);
    for (const change of summary.changed) {
      lines.push(`- Edited **${change.label}**:`);
      for (const field of change.fields) {
        lines.push(`  - ${field.label}: \`${field.from}\` → \`${field.to}\``);
      }
    }
    if (summary.reordered) lines.push("- Reordered entries");
    lines.push("");
  }
  lines.push("Merging this pull request publishes the changes to the live site.");
  return lines.join("\n");
}
