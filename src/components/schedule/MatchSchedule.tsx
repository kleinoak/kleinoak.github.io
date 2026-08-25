import type { Match, MatchTimes } from "@/data/matches";
import { levelColumns } from "@/data/matches";

/**
 * The season schedule, rendered twice: a table on wide screens where the
 * levels read best side by side, and one card per match on phones, where a
 * four-column table cannot fit without horizontal scrolling.
 *
 * Only one of the two is ever displayed, so assistive technology sees a
 * single copy.
 *
 * `level` narrows both layouts to one team's start times. Everything below
 * works off the resulting column list, so the two layouts cannot drift.
 *
 * Results are per level and attach to the level, never to the row: on a phone
 * and in the all-levels table they sit under that team's start time, and only
 * a filtered view spends a whole column on them. A row where JV lost and
 * varsity won has to be able to say both things at once.
 */

/** A blank cell means "no entry for this level"; "x" means "not playing". */
function TimeValue({ value }: { value: string }) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return (
      <>
        <span aria-hidden="true" className="text-text-muted/50">
          —
        </span>
        <span className="sr-only">Not listed</span>
      </>
    );
  }

  if (trimmed.toLowerCase() === "x") {
    return (
      <>
        <span aria-hidden="true" className="text-text-muted/50">
          —
        </span>
        <span className="sr-only">Not playing</span>
      </>
    );
  }

  return <span>{trimmed}</span>;
}

/**
 * One level's result. Absence means "no result posted" — never a loss, never a
 * cancellation — so an empty cell is rendered as a dash with that said out
 * loud for screen readers rather than left silent.
 *
 * `bare` drops the dash: inside a level's own cell, where the time is already
 * showing, four dashes stacked under four times would be noise rather than
 * information. There the absence of a badge is the whole message.
 */
function ResultValue({ value, bare = false }: { value?: string; bare?: boolean }) {
  const trimmed = value?.trim();

  if (!trimmed) {
    if (bare) return null;
    return (
      <>
        <span aria-hidden="true" className="text-text-muted/50">
          —
        </span>
        <span className="sr-only">No result posted</span>
      </>
    );
  }

  // "W 3–0" / "L 0–2" / a tournament record like "5–1".
  const outcome = /^w\b/i.test(trimmed) ? "win" : /^l\b/i.test(trimmed) ? "loss" : "record";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-semibold tabular-nums ${
        outcome === "win"
          ? "bg-accent/15 text-accent-strong"
          : outcome === "loss"
            ? "bg-black/5 text-text-muted"
            : "bg-primary/5 text-primary"
      }`}
    >
      {trimmed}
    </span>
  );
}

function HomeAway({ location }: { location?: string }) {
  if (!location) return null;
  const normalized = location.toLowerCase();

  if (normalized === "home" || normalized === "away") {
    return (
      <span
        className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
          normalized === "home" ? "bg-accent/15 text-accent-strong" : "bg-black/5 text-text-muted"
        }`}
      >
        {location}
      </span>
    );
  }

  return <span className="text-text-muted">{location}</span>;
}

export function MatchSchedule({
  matches,
  caption,
  level,
}: {
  matches: Match[];
  caption: string;
  /** Show only this level's start times. Omit for all four. */
  level?: keyof MatchTimes;
}) {
  if (matches.length === 0) return null;

  const columns = level ? levelColumns.filter((column) => column.key === level) : levelColumns;

  const hasResults = (key: keyof MatchTimes) =>
    matches.some((match) => match.results?.[key]?.trim());

  // Rank One publishes results per team, so a level shows results only when its
  // own calendar has posted some. Two layouts, because four extra columns would
  // not fit: filtered to one level the result gets its own column, and in the
  // all-levels view each result sits under that level's start time. Either way
  // a level with nothing posted is simply not shown one — an always-empty
  // column would imply that level's results are missing rather than untracked.
  const showResultColumn = Boolean(level) && hasResults(level as keyof MatchTimes);
  const showInlineResults = !level && levelColumns.some((column) => hasResults(column.key));

  return (
    <>
      {/* Wide screens: one row per match. */}
      <div className="mt-8 hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b-2 border-primary text-left">
              <th scope="col" className="py-3 pr-4 font-semibold text-primary">
                Date
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold text-primary">
                Opponent
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold text-primary">
                Location
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="py-3 pr-4 text-right font-semibold text-primary"
                >
                  {column.label}
                </th>
              ))}
              {showResultColumn && (
                <th scope="col" className="py-3 pr-4 text-right font-semibold text-primary">
                  Result
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b border-border align-top">
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className="font-semibold text-primary">{match.date || "TBD"}</span>
                  {match.day && (
                    <span className="block text-xs text-text-muted">{match.day}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-semibold text-primary">{match.opponent}</span>
                  {match.note && (
                    <span className="mt-1 block text-xs text-text-muted">{match.note}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <HomeAway location={match.location} />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="py-3 pr-4 text-right tabular-nums">
                    <TimeValue value={match.times[column.key]} />
                    {showInlineResults && match.results?.[column.key]?.trim() && (
                      <span className="mt-1 block">
                        <span className="sr-only">Result: </span>
                        <ResultValue value={match.results[column.key]} bare />
                      </span>
                    )}
                  </td>
                ))}
                {showResultColumn && (
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    <ResultValue value={match.results?.[level as keyof MatchTimes]} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per match, times in a 2x2 grid. */}
      <ul className="mt-8 space-y-4 md:hidden">
        {matches.map((match) => (
          <li key={match.id} className="rounded-sm border border-border bg-background p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-display text-base font-bold uppercase tracking-tight text-primary">
                {match.opponent}
              </p>
              <HomeAway location={match.location} />
            </div>

            <p className="mt-1 text-sm text-text-muted">
              {match.date || "Date TBD"}
              {match.day ? ` · ${match.day}` : ""}
            </p>

            <dl className={`mt-4 grid gap-2 ${columns.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {columns.map((column) => (
                <div key={column.key} className="rounded-sm bg-surface px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {column.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                    <TimeValue value={match.times[column.key]} />
                  </dd>
                  {match.results?.[column.key]?.trim() && (
                    <dd className="mt-1.5">
                      <span className="sr-only">Result: </span>
                      <ResultValue value={match.results[column.key]} bare />
                    </dd>
                  )}
                </div>
              ))}
            </dl>

            {match.note && <p className="mt-3 text-xs text-text-muted">{match.note}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
