"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  History,
  LogOut,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { CmsProvider, useCms } from "../CmsProvider";
import { collectionGroups, getCollection } from "../schema";
import { CollectionEditor } from "./CollectionEditor";
import { PublishPanel } from "./PublishPanel";
import { SignIn } from "./SignIn";
import { AdminButton, Banner, Panel } from "./ui";

export function AdminApp() {
  return (
    <CmsProvider>
      <AdminShell />
    </CmsProvider>
  );
}

function readHashView(): string {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash || "home";
}

function AdminShell() {
  const { status, user, repo, target, dirtyCollections, reload, signOut, busy, error } = useCms();
  const [view, setView] = useState("home");

  useEffect(() => {
    const sync = () => setView(readHashView());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = useCallback((next: string) => {
    window.location.hash = `#/${next}`;
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  // Don't let anyone lose unpublished work by closing the tab.
  useEffect(() => {
    if (!dirtyCollections.length) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyCollections.length]);

  if (status !== "ready") return <SignIn />;

  const collection = getCollection(view);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="font-display text-base font-bold uppercase tracking-tight text-primary"
          >
            KO Volleyball — Website Editor
          </button>

          <span className="hidden text-xs text-text-muted sm:inline">
            {target.owner}/{target.repo} · {target.branch}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-primary"
            >
              View site
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
            <AdminButton variant="ghost" onClick={() => void reload()} disabled={busy}>
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Reload
            </AdminButton>
            {user && (
              <span className="hidden items-center gap-2 text-sm text-text-muted sm:inline-flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                {user.login}
              </span>
            )}
            <AdminButton variant="ghost" onClick={signOut}>
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sign out
            </AdminButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <nav aria-label="Content sections" className="lg:w-60 lg:flex-none">
          <ul className="flex flex-col gap-4">
            <li>
              <SidebarLink
                active={view === "home"}
                onClick={() => navigate("home")}
                label="Overview"
              />
            </li>
            {collectionGroups().map((group) => (
              <li key={group.group}>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {group.group}
                </p>
                <ul className="mt-1 flex flex-col">
                  {group.collections.map((entry) => (
                    <li key={entry.name}>
                      <SidebarLink
                        active={view === entry.name}
                        onClick={() => navigate(entry.name)}
                        label={entry.label}
                        dirty={dirtyCollections.some((item) => item.name === entry.name)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <AdminButton
              variant={dirtyCollections.length ? "primary" : "secondary"}
              className="w-full"
              onClick={() => navigate("publish")}
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Review &amp; publish
              {dirtyCollections.length > 0 && (
                <span className="rounded-sm bg-accent px-1.5 text-xs font-bold text-primary">
                  {dirtyCollections.length}
                </span>
              )}
            </AdminButton>
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {error && (
            <div className="mb-4">
              <Banner tone="error" title="Something went wrong">
                {error}
              </Banner>
            </div>
          )}
          {repo && !repo.permissions?.push && (
            <div className="mb-4">
              <Banner tone="warning" title="Read-only access">
                Your account cannot write to this repository, so publishing will fail.
              </Banner>
            </div>
          )}

          {view === "publish" ? (
            <PublishPanel onNavigate={navigate} />
          ) : collection ? (
            <CollectionEditor collection={collection} />
          ) : (
            <Overview onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  active,
  onClick,
  label,
  dirty,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dirty?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
        active
          ? "bg-primary font-semibold text-white"
          : "text-text hover:bg-background hover:text-primary"
      }`}
    >
      {label}
      {dirty && (
        <span
          title="Unpublished changes"
          className="h-2 w-2 flex-none rounded-full bg-accent-strong"
        />
      )}
    </button>
  );
}

function Overview({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { recentCommits, dirtyCollections, user, repo } = useCms();

  return (
    <div className="flex flex-col gap-4">
      <Panel title={`Welcome${user ? `, ${user.name ?? user.login}` : ""}`}>
        <div className="flex flex-col gap-3 text-sm text-text">
          <p>
            Pick a section on the left, make your edits, then use{" "}
            <strong>Review &amp; publish</strong>. Nothing changes on the public site until you
            publish.
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-text-muted">
            <li>Your edits are kept in this browser until you publish them.</li>
            <li>
              Every publish is recorded in the website&apos;s history with your GitHub name, so
              anything can be traced or undone.
            </li>
            <li>
              Not sure about a change? Choose <strong>Ask for review first</strong> when publishing.
            </li>
          </ul>
        </div>
      </Panel>

      {dirtyCollections.length > 0 && (
        <Banner
          tone="warning"
          title={`${dirtyCollections.length} section${dirtyCollections.length === 1 ? "" : "s"} with unpublished changes`}
          actions={
            <AdminButton variant="primary" onClick={() => onNavigate("publish")}>
              <Send aria-hidden="true" className="h-4 w-4" />
              Review &amp; publish
            </AdminButton>
          }
        >
          <span className="inline-flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="h-4 w-4" />
            {dirtyCollections.map((collection) => collection.label).join(", ")}
          </span>
        </Banner>
      )}

      <Panel
        title="Recent updates"
        description={
          <span className="inline-flex items-center gap-1.5">
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            The last content changes published to the site.
          </span>
        }
      >
        {recentCommits.length === 0 ? (
          <p className="text-sm text-text-muted">No content changes recorded yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recentCommits.map((commit) => (
              <li key={commit.sha} className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm">
                <a
                  href={commit.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {commit.message}
                </a>
                <span className="text-xs text-text-muted">
                  {commit.authorLogin ?? commit.authorName} ·{" "}
                  {new Date(commit.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {repo && (
        <p className="inline-flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Signed in to {repo.full_name} with write access. Sign out to erase your token from this
          browser.
        </p>
      )}
    </div>
  );
}
