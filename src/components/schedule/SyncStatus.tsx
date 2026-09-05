import { RefreshCw } from "lucide-react";
import { changedAt, checkedAt, gameCount } from "@/data/rankone";

/**
 * "When did the robot last look?", above the Rank One callout.
 *
 * Two facts, and the distinction is the whole point:
 *
 * - **Checked** moves on every run, three times a day, whether or not anything
 *   differed. "We looked at 6am and nothing had moved" is the reassurance
 *   somebody wants the night before a match, and a date that only advances when
 *   data changes cannot say it.
 * - **Changed** moves only when the fixtures themselves differ. That is the one
 *   that answers "is this stale?".
 *
 * Both are formatted from stored instants, never from `new Date()`, so this
 * stays a server component and the prerendered HTML is stable — a "2 hours ago"
 * would be wrong the moment the page was cached, which for a static export is
 * immediately.
 */

const CENTRAL = "America/Chicago";

/** e.g. "Sat, Sep 5 at 5:32 PM" — the program's clock, not the reader's. */
function formatInstant(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${day} at ${time}`;
}

/** e.g. "Sep 5". Parsed by hand: `new Date("2026-09-05")` is UTC midnight and
 *  prints as Sep 4 in Central, which is the bug this file exists to avoid. */
function formatDay(value: string) {
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return null;
  const [, year, month, day] = parts;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SyncStatus() {
  const checked = formatInstant(checkedAt);
  if (!checked) return null;

  const changed = formatDay(changedAt);

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success/40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Automated Rank One sync
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            Last checked{" "}
            <time dateTime={checkedAt} className="font-semibold text-text">
              {checked}
            </time>{" "}
            <span className="whitespace-nowrap">Central time</span>
          </p>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-text-muted sm:justify-end">
        <div className="flex items-center gap-1.5">
          <dt>Schedule last changed</dt>
          <dd className="font-semibold text-text">
            {changed ? <time dateTime={changedAt}>{changed}</time> : "—"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Fixtures tracked</dt>
          {/* One <span>, not bare text: this <dd> is a flex container, so
              adjacent text nodes become separate flex items and the space
              between "124" and "fixtures" is dropped. */}
          <dd className="inline-flex items-center gap-1.5">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 text-accent-strong" />
            <span>{`${gameCount} fixtures · checked 3\u00d7 daily`}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
