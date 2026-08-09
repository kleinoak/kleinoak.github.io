import type { Match } from "@/data/matches";
import { levelColumns } from "@/data/matches";

/**
 * The season schedule, rendered twice: a table on wide screens where the
 * four levels read best side by side, and one card per match on phones,
 * where a four-column table cannot fit without horizontal scrolling.
 *
 * Only one of the two is ever displayed, so assistive technology sees a
 * single copy.
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

export function MatchSchedule({ matches, caption }: { matches: Match[]; caption: string }) {
  if (matches.length === 0) return null;

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
              {levelColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="py-3 pr-4 text-right font-semibold text-primary"
                >
                  {column.label}
                </th>
              ))}
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
                {levelColumns.map((column) => (
                  <td key={column.key} className="py-3 pr-4 text-right tabular-nums">
                    <TimeValue value={match.times[column.key]} />
                  </td>
                ))}
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

            <dl className="mt-4 grid grid-cols-2 gap-2">
              {levelColumns.map((column) => (
                <div key={column.key} className="rounded-sm bg-surface px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {column.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                    <TimeValue value={match.times[column.key]} />
                  </dd>
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
