"use client";

import { useState } from "react";
import { ExternalLink, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { tokenSetupUrl, type RepoTarget } from "../config";
import { useCms } from "../CmsProvider";
import { AdminButton, Banner, Panel } from "./ui";

export function SignIn() {
  const { signIn, busy, error, status, target: knownTarget } = useCms();
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [showRepo, setShowRepo] = useState(false);
  // Follows the stored repository until the editor types a different one.
  const [edited, setEdited] = useState<RepoTarget | null>(null);
  const target = edited ?? knownTarget;
  const setTarget = setEdited;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-10 sm:py-16">
      <header>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
          Klein Oak Volleyball
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-primary">
          Website Editor
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Update announcements, dates, teams, sponsors and contact details. Changes are saved
          to the website&apos;s GitHub repository and the site rebuilds itself — usually within a
          couple of minutes.
        </p>
      </header>

      {status === "connecting" && !error && (
        <Banner tone="info">
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Connecting to {target.owner}/{target.repo}…
          </span>
        </Banner>
      )}

      {error && (
        <Banner tone="error" title="Could not sign in">
          {error}
        </Banner>
      )}

      <Panel
        title="Sign in"
        description="You need a GitHub account that has been invited to this website's repository."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn(token.trim(), remember, target);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-primary">GitHub access token</span>
            <input
              type="password"
              value={token}
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_…"
              onChange={(event) => setToken(event.target.value)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm focus:border-accent-strong focus:outline-none"
            />
          </label>

          <label className="inline-flex items-start gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-accent-strong)]"
            />
            <span>
              Stay signed in on this device
              <span className="block text-xs text-text-muted">
                Only tick this on a personal computer. Otherwise the token is forgotten when you
                close the tab.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="primary" disabled={busy || token.trim() === ""}>
              {busy ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound aria-hidden="true" className="h-4 w-4" />
              )}
              Sign in
            </AdminButton>
            <button
              type="button"
              onClick={() => setShowRepo((value) => !value)}
              className="text-sm text-text-muted underline underline-offset-2 hover:text-primary"
            >
              {showRepo ? "Hide" : "Change"} repository ({target.owner}/{target.repo} ·{" "}
              {target.branch})
            </button>
          </div>

          {showRepo && (
            <div className="grid gap-3 rounded-sm border border-border bg-surface p-4 sm:grid-cols-3">
              {(["owner", "repo", "branch"] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {key === "repo" ? "Repository" : key}
                  </span>
                  <input
                    type="text"
                    value={target[key]}
                    onChange={(event) => setTarget({ ...target, [key]: event.target.value.trim() })}
                    className="rounded-sm border border-border bg-background px-2 py-1.5 text-sm focus:border-accent-strong focus:outline-none"
                  />
                </label>
              ))}
            </div>
          )}
        </form>
      </Panel>

      <Panel title="Getting a token (one time, about two minutes)">
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm text-text">
          <li>
            Open{" "}
            <a
              href={tokenSetupUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-accent-strong underline underline-offset-2"
            >
              GitHub&apos;s fine-grained token page
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>{" "}
            while signed in to your GitHub account.
          </li>
          <li>
            Name it something like <code className="font-mono text-xs">KO Volleyball editor</code>{" "}
            and set an expiration (90 days is a good default).
          </li>
          <li>
            Under <strong>Repository access</strong> choose <strong>Only select repositories</strong>{" "}
            and pick{" "}
            <code className="font-mono text-xs">
              {target.owner}/{target.repo}
            </code>
            .
          </li>
          <li>
            Under <strong>Repository permissions</strong> set <strong>Contents</strong> to{" "}
            <strong>Read and write</strong>. If you would rather have your changes reviewed before
            they go live, also set <strong>Pull requests</strong> to{" "}
            <strong>Read and write</strong>. Everything else can stay on <em>No access</em>.
          </li>
          <li>
            Generate the token, copy it, and paste it above. GitHub only shows it once — if you lose
            it, generate a new one.
          </li>
        </ol>
      </Panel>

      <Banner tone="info" title="Where your token goes">
        <p className="inline-flex items-start gap-2">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            This editor has no server of its own. It runs in your browser and talks directly to
            github.com. Your token is kept in this browser only (this tab, unless you tick
            &ldquo;stay signed in&rdquo;) and is never sent anywhere else. Sign out to erase it.
          </span>
        </p>
      </Banner>
    </div>
  );
}
