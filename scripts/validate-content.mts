/**
 * Content gate. Runs automatically before every build (`prebuild`) and on every
 * pull request, using the exact same rules the /admin editor enforces while
 * typing — so content edited by hand, or an editor's stale draft, can never
 * take the published site down.
 *
 * Run directly with Node (no build step): `npm run validate:content`
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collections } from "../src/cms/schema.ts";
import { getPath, validateCollectionData } from "../src/cms/validation.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type Problem = { file: string; message: string };

const problems: Problem[] = [];
let checked = 0;

for (const collection of collections) {
  const absolute = resolve(repoRoot, collection.file);

  if (!existsSync(absolute)) {
    problems.push({ file: collection.file, message: "File is missing." });
    continue;
  }

  let data: unknown;
  try {
    data = JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    problems.push({
      file: collection.file,
      message: `Not valid JSON — ${(error as Error).message}`,
    });
    continue;
  }

  for (const issue of validateCollectionData(collection, data)) {
    const where = issue.index === undefined ? "" : `entry ${issue.index + 1}: `;
    problems.push({ file: collection.file, message: `${where}${issue.message}` });
  }

  // Every photo referenced by content must actually exist in public/.
  const items = Array.isArray(data) ? data : [data];
  for (const [index, item] of items.entries()) {
    for (const field of collection.fields) {
      if (field.type !== "image") continue;
      const photo = getPath(item, field.name) as { src?: unknown } | undefined;
      if (!photo || typeof photo.src !== "string") continue;
      const assetPath = resolve(repoRoot, "public", photo.src.replace(/^\//, ""));
      if (!existsSync(assetPath)) {
        problems.push({
          file: collection.file,
          message: `entry ${index + 1}: photo "${photo.src}" is not in the repository (public${photo.src}).`,
        });
      }
    }
  }

  checked += 1;
}

if (problems.length > 0) {
  console.error("\nContent validation failed:\n");
  for (const problem of problems) {
    console.error(`  ${problem.file}  ${problem.message}`);
  }
  console.error(
    `\n${problems.length} problem(s) found. Fix them in the editor at /admin, or edit the JSON directly.\n`,
  );
  process.exit(1);
}

console.log(`Content OK — ${checked} file(s) validated.`);
