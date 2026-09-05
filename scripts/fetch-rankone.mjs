/**
 * Pull the four Rank One calendars and write `content/rankone.json`.
 *
 *   node scripts/fetch-rankone.mjs            # fetch, parse, write if changed
 *   node scripts/fetch-rankone.mjs --dry-run  # parse and report, write nothing
 *
 * Why this exists: the schedule on this site was transcribed by hand from four
 * live feeds, and PROJECT-LOG has two entries about times and results drifting
 * out of date between reconciliations. This is that reconciliation, on a timer.
 *
 * What it does NOT do, deliberately: it never touches `content/matches.json`.
 * That file is the curated spine — the section a fixture belongs to, the short
 * opponent names a parent recognises, and the "x" that means *this level is not
 * playing* — and none of that exists in the feed. This script writes a separate
 * generated file that the site reads alongside it, so the worst a bad scrape can
 * do is show stale or missing enrichment. It cannot corrupt the schedule.
 *
 * Three things about Rank One, all learned the hard way:
 *
 * 1. **It 302s a request with no browser User-Agent.** The redirect is to a
 *    login-ish page and the body is 130 bytes, so it fails as an empty parse
 *    rather than an error unless you check the status.
 * 2. **It rate-limits.** Four requests back to back get 302s even with a good
 *    User-Agent. Hence the delay between levels and the retry with backoff.
 * 3. **Everything useful is in `id="rpt_Games_<field>_<n>"` spans**, including
 *    the bits the site never had: the venue, a Google Maps link carrying the
 *    street address, and a per-game note.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const OUT = "content/rankone.json";
const DRY_RUN = process.argv.includes("--dry-run");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

const BASE =
  "https://app.rankone.com/Schedules/View_Schedule_Web.aspx" +
  "?P=0&D=68683AA1-0C8E-4F59-8F36-843B0E3A1B91&S=946&Sp=5";

/** Level key → Rank One team and level ids, and the minimum rows we expect. */
const LEVELS = [
  { key: "varsity", label: "Varsity", tm: "18086", l: "1", min: 20 },
  { key: "jv", label: "Junior Varsity", tm: "18087", l: "2", min: 12 },
  { key: "flex", label: "Flex", tm: "195078", l: "12", min: 10 },
  { key: "freshmen", label: "Freshman", tm: "22683", l: "3", min: 12 },
];

const urlFor = (level) => `${BASE}&Tm=${level.tm}&L=${level.l}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const strip = (fragment) =>
  fragment
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function span(row, name, index) {
  const match = row.match(
    new RegExp(`id="rpt_Games_${name}_${index}"[^>]*>([\\s\\S]*?)</span>`),
  );
  return match ? strip(match[1]) : "";
}

/** `8/7/2026 5:00:00 PM` → `2026-08-07`. The hidden field is the only date that
 *  is unambiguous — the visible label is "Aug 7" with no year. */
function isoDate(value) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return "";
  const [, m, d, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** `W  3 - 0` → `W 3–0`, matching how results are written in matches.json. */
function normaliseScore(value) {
  if (!value) return "";
  const match = value.match(/^([WLT])\s*(\d+)\s*-\s*(\d+)$/i);
  if (!match) return value.replace(/\s+/g, " ").trim();
  return `${match[1].toUpperCase()} ${match[2]}–${match[3]}`;
}

/** Rank One emits `http://maps.google.com/?q=1830 Katyland Dr. 77493 TX` —
 *  plain http, and the address unencoded. Keep the address as text (it is the
 *  useful part) and rebuild the link properly. */
function mapFrom(href) {
  if (!href) return { address: "", map: "" };
  const raw = href.split("?q=")[1];
  if (!raw) return { address: "", map: "" };
  const address = decodeURIComponent(raw.replace(/\+/g, " ")).replace(/\s+/g, " ").trim();
  return {
    address,
    map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  };
}

export function parseSchedule(html) {
  const games = [];
  const indexes = [...html.matchAll(/id="rpt_Games_repeaterGameRow_(\d+)"/g)].map((m) => +m[1]);

  for (const index of indexes) {
    const start = html.indexOf(`id="rpt_Games_repeaterGameRow_${index}"`);
    const nextAt = html.indexOf(`id="rpt_Games_repeaterGameRow_${index + 1}"`);
    const row = html.slice(start, nextAt < 0 ? start + 20000 : nextAt);

    const startAttr = row.match(new RegExp(`id="rpt_Games_hf_StartDate_${index}"[^>]*value="([^"]*)"`));
    const mapAttr = row.match(new RegExp(`id="rpt_Games_lnkMap_${index}"[^>]*href="([^"]*)"`));
    const { address, map } = mapFrom(mapAttr ? mapAttr[1] : "");

    const date = isoDate(startAttr ? startAttr[1] : "");
    if (!date) continue; // a row with no parseable date is not a fixture

    const homeAway = span(row, "lbl_Location", index);

    games.push({
      date,
      time: span(row, "lbl_Start_Time", index),
      // Rank One writes "@" for away and "vs" for home.
      home: homeAway !== "@",
      opponent: span(row, "lbl_Opponent", index),
      venue: span(row, "lbl_Venue", index),
      address,
      map,
      note: span(row, "lbl_SpecialNote", index),
      status: span(row, "lbl_StatusInfo2", index),
      result: normaliseScore(span(row, "lbl_Score", index)),
    });
  }

  // Sort by date then time so a diff is about content, not row order.
  return games.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

async function fetchLevel(level) {
  const url = urlFor(level);
  let lastError = "";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        redirect: "manual",
        signal: AbortSignal.timeout(45_000),
      });

      // A 302 here is the rate limiter, not a moved page. Treat it as retryable
      // rather than following it into a 130-byte body that parses as zero games.
      if (response.status === 200) {
        const html = await response.text();
        const games = parseSchedule(html);
        if (games.length >= level.min) return { games, bytes: html.length };
        lastError = `parsed ${games.length} games, expected at least ${level.min}`;
      } else {
        lastError = `HTTP ${response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt < 4) {
      const wait = attempt * 5000;
      console.log(`  ${level.key}: ${lastError} — retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }

  throw new Error(`${level.key}: gave up after 4 attempts (${lastError})`);
}

async function main() {
  const levels = {};
  let total = 0;

  for (const [index, level] of LEVELS.entries()) {
    if (index > 0) await sleep(4000); // Rank One 302s a burst of requests.
    const { games, bytes } = await fetchLevel(level);
    levels[level.key] = {
      label: level.label,
      teamId: level.tm,
      url: urlFor(level),
      games,
    };
    total += games.length;
    const withResult = games.filter((g) => g.result).length;
    const withMap = games.filter((g) => g.map).length;
    console.log(
      `${level.key.padEnd(9)} ${String(games.length).padStart(3)} games  ` +
        `${String(withResult).padStart(3)} results  ${String(withMap).padStart(3)} venues  ` +
        `(${(bytes / 1024).toFixed(0)} KB)`,
    );
  }

  // Nothing below this line should be reachable with a broken scrape: every level
  // either returned at least its minimum or threw above.
  const previous = existsSync(OUT) ? JSON.parse(await readFile(OUT, "utf8")) : null;

  // `fetchedAt` changes on every run, so compare everything else. Otherwise the
  // job commits a new timestamp twice a day forever and every one of those commits
  // triggers a rebuild that changes nothing a reader can see.
  const sameAsBefore =
    previous && JSON.stringify(previous.levels) === JSON.stringify(levels);

  const payload = {
    source: "Rank One",
    fetchedAt: sameAsBefore ? previous.fetchedAt : new Date().toISOString().slice(0, 10),
    levels,
  };

  console.log(`\ntotal:    ${total} games across ${LEVELS.length} levels`);

  if (sameAsBefore) {
    console.log(`unchanged: ${OUT} already matches the feeds — not rewriting.`);
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log(`dry run:  ${OUT} would change.`);
    process.exit(0);
  }

  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`written:  ${OUT}`);
}

// Only fetch when run as a script. `parseSchedule` is exported so it can be
// exercised against a saved page without hitting Rank One — which is how the
// hostile-input cases (a 130-byte redirect body, an empty response) were
// checked, and the reason a bad scrape parses to zero games rather than to
// something that looks plausible.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
