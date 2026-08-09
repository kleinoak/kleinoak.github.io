"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, GitPullRequest, Loader2, Rocket } from "lucide-react";
import { useCms, type PublishMode, type PublishOutcome } from "../CmsProvider";
import type { ChangeSummary } from "../changes";
import { AdminButton, Banner, Panel } from "./ui";

export function PublishPanel({ onNavigate }: { onNavigate: (collectionName: string) => void }) {
  const { summaries, dirtyCollections, defaultMessage, publish, busy, issuesFor, discardEverything } =
    useCms();
  // Until the editor types their own message, follow the generated summary.
  const [typedMessage, setTypedMessage] = useState<string | null>(null);
  const message = typedMessage ?? defaultMessage;
  const [mode, setMode] = useState<PublishMode>("direct");
  const [outcome, setOutcome] = useState<PublishOutcome | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const blocking = dirtyCollections.flatMap((collection) =>
    issuesFor(collection.name).map((issue) => ({ collection, issue })),
  );

  if (outcome) {
    return (
      <Panel title={outcome.mode === "direct" ? "Published" : "Sent for review"}>
        <Banner
          tone="success"
          title={
            outcome.mode === "direct"
              ? "Your changes are on their way to the website"
              : `Pull request #${outcome.pullRequestNumber} opened`
          }
        >
          {outcome.mode === "direct" ? (
            <p>
              The site rebuilds automatically — give it a couple of minutes, then refresh the public
              page to see the change.
            </p>
          ) : (
            <p>
              Nothing is live yet. Someone with access reviews the pull request and merges it; the
              site rebuilds after that.
            </p>
          )}
          <p className="mt-3 flex flex-wrap gap-4">
            {outcome.pullRequestUrl && (
              <a
                href={outcome.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
              >
                Open the pull request
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href={outcome.commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              View the change on GitHub
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </p>
        </Banner>
        <div className="mt-4">
          <AdminButton variant="secondary" onClick={() => setOutcome(null)}>
            Back to editing
          </AdminButton>
        </div>
      </Panel>
    );
  }

  if (!dirtyCollections.length) {
    return (
      <Panel title="Review &amp; publish">
        <p className="text-sm text-text-muted">
          You have no unpublished changes. Pick a section on the left to edit something.
        </p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Review &amp; publish"
        description="Check every change below before it goes on the public site."
        actions={
          <AdminButton variant="ghost" onClick={discardEverything}>
            Discard all my changes
          </AdminButton>
        }
      >
        <div className="flex flex-col gap-5">
          {summaries.map((summary) => (
            <SummaryBlock key={summary.collection.name} summary={summary} onNavigate={onNavigate} />
          ))}
        </div>
      </Panel>

      {blocking.length > 0 && (
        <Banner tone="error" title="Fix these before publishing">
          <ul className="mt-1 list-disc pl-5">
            {blocking.map(({ collection, issue }, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onNavigate(collection.name)}
                  className="underline underline-offset-2"
                >
                  {collection.label}
                </button>
                {issue.index !== undefined && ` (entry ${issue.index + 1})`}: {issue.message}
              </li>
            ))}
          </ul>
        </Banner>
      )}

      {failure && (
        <Banner tone="error" title="Publishing failed">
          <pre className="mt-1 whitespace-pre-wrap font-sans">{failure}</pre>
        </Banner>
      )}

      <Panel title="Publish">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-primary">
              What are you changing? (saved in the history)
            </span>
            <input
              type="text"
              value={message}
              onChange={(event) => setTypedMessage(event.target.value)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-primary">How should this go out?</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="publish-mode"
                checked={mode === "direct"}
                onChange={() => setMode("direct")}
                className="mt-1 accent-[var(--color-accent-strong)]"
              />
              <span>
                Publish now
                <span className="block text-xs text-text-muted">
                  Goes straight to the live website. Best for routine updates.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="publish-mode"
                checked={mode === "propose"}
                onChange={() => setMode("propose")}
                className="mt-1 accent-[var(--color-accent-strong)]"
              />
              <span>
                Ask for review first
                <span className="block text-xs text-text-muted">
                  Opens a pull request on GitHub. Nothing changes on the site until someone merges
                  it.
                </span>
              </span>
            </label>
          </fieldset>

          <div>
            <AdminButton
              variant="primary"
              disabled={busy || blocking.length > 0 || message.trim() === ""}
              onClick={async () => {
                setFailure(null);
                try {
                  const result = await publish({ message: message.trim(), mode });
                  setOutcome(result);
                  setTypedMessage(null);
                } catch (error) {
                  setFailure(error instanceof Error ? error.message : "Something went wrong.");
                }
              }}
            >
              {busy ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : mode === "direct" ? (
                <Rocket aria-hidden="true" className="h-4 w-4" />
              ) : (
                <GitPullRequest aria-hidden="true" className="h-4 w-4" />
              )}
              {mode === "direct" ? "Publish to the website" : "Open a pull request"}
            </AdminButton>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SummaryBlock({
  summary,
  onNavigate,
}: {
  summary: ChangeSummary;
  onNavigate: (collectionName: string) => void;
}) {
  return (
    <div className="rounded-sm border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-tight text-primary">
          {summary.collection.label}
        </h3>
        <button
          type="button"
          onClick={() => onNavigate(summary.collection.name)}
          className="text-xs font-semibold text-text-muted underline underline-offset-2 hover:text-primary"
        >
          Edit
        </button>
      </div>
      <ul className="flex flex-col gap-2 px-4 py-3 text-sm">
        {summary.added.map((label) => (
          <li key={`added-${label}`} className="flex items-start gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-success" />
            <span>
              Added <strong>{label}</strong>
            </span>
          </li>
        ))}
        {summary.removed.map((label) => (
          <li key={`removed-${label}`} className="flex items-start gap-2 text-danger">
            <span aria-hidden="true" className="mt-0.5 font-bold">
              −
            </span>
            <span>
              Removed <strong>{label}</strong>
            </span>
          </li>
        ))}
        {summary.changed.map((change) => (
          <li key={`changed-${change.label}`}>
            <p>
              Edited <strong>{change.label}</strong>
            </p>
            <ul className="mt-1 flex flex-col gap-1 pl-4 text-xs text-text-muted">
              {change.fields.map((field) => (
                <li key={field.field}>
                  {field.label}: <span className="line-through">{field.from}</span> →{" "}
                  <span className="font-semibold text-text">{field.to}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {summary.reordered && <li>Reordered the entries</li>}
      </ul>
    </div>
  );
}
