/**
 * Turn the photo drops in `content/images/` into web-ready derivatives and a
 * manifest the site can render.
 *
 *   node scripts/build-gallery.mjs
 *
 * Why a script and not a CMS collection: there are ~140 photos. Adding them one
 * by one through /admin would be miserable, and `content/gallery.json` is
 * generated — hand-editing it is not the workflow. To add photos, drop them in
 * a folder under `content/images/` and re-run this.
 *
 * Why derivatives at all: `images.unoptimized` is on because GitHub Pages
 * cannot run Next's optimiser, so whatever lands in `public/` is byte-for-byte
 * what a visitor downloads. The originals are ~36 MB of full-resolution JPEG.
 * Each photo becomes two WebPs — a grid thumbnail and a lightbox-sized full —
 * which is roughly a third of the weight and lets the grid load thumbnails
 * rather than 1024×1536 originals scaled down by the browser.
 *
 * Re-running is safe: it only re-encodes when the derivative is missing or
 * older than its source.
 */
import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "content/images";
const OUT_DIR = "public/images/gallery";
const MANIFEST = "content/gallery.json";

const THUMB = { width: 600, quality: 74, suffix: "-thumb" };
const FULL = { width: 1400, quality: 80, suffix: "" };

/**
 * Folder name → how it should read on the page. A folder with no entry here
 * still works; it just gets a title derived from its name, so dropping in a new
 * album does not require editing this file first.
 */
const ALBUM_TITLES = {
  varsity: "Varsity",
  jv: "Junior Varsity",
  flex: "Flex",
  freshmen: "Freshman",
  "waller-isd-tournament": "Waller ISD Tournament",
};

const ALBUM_ORDER = ["waller-isd-tournament", "varsity", "jv", "flex", "freshmen"];

const IMAGE_RE = /\.(jpe?g|png)$/i;

const titleFrom = (slug) =>
  ALBUM_TITLES[slug] ??
  slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Natural sort so A28A2 9 sorts before A28A2 10, and stable across machines. */
const natural = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

async function findAlbums(root) {
  const albums = [];
  const loose = [];
  const walk = async (dir, trail) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && IMAGE_RE.test(e.name) && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort(natural);
    const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));

    // A folder holding images is an album. Folders holding only folders (like
    // the photographer's collection wrapper) are containers, not albums.
    //
    // Files sitting loose at the top of `content/images/` are not an album
    // either — the hero banner lives there — so they are reported and skipped
    // rather than silently swept into a nameless gallery.
    if (files.length && trail.length === 0) {
      loose.push(...files.map((f) => path.join(dir, f)));
    } else if (files.length) {
      albums.push({ dir, trail, files });
    }
    for (const d of dirs) await walk(path.join(dir, d.name), [...trail, d.name]);
  };
  await walk(root, []);
  return { albums, loose };
}

async function derive(src, outPath, { width, quality }) {
  if (existsSync(outPath)) {
    const [s, o] = await Promise.all([stat(src), stat(outPath)]);
    if (o.mtimeMs >= s.mtimeMs) return sharp(outPath).metadata();
  }
  await mkdir(path.dirname(outPath), { recursive: true });
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outPath);
  return sharp(outPath).metadata();
}

const { albums, loose } = await findAlbums(SOURCE);
if (!albums.length) {
  console.error(`No images found under ${SOURCE}/`);
  process.exit(1);
}

const manifest = [];
let encoded = 0;
let bytes = 0;

for (const album of albums) {
  const slug = album.trail[album.trail.length - 1];
  const photos = [];

  for (const file of album.files) {
    const src = path.join(album.dir, file);
    const base = path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const fullPath = path.join(OUT_DIR, slug, `${base}${FULL.suffix}.webp`);
    const thumbPath = path.join(OUT_DIR, slug, `${base}${THUMB.suffix}.webp`);

    const before = existsSync(fullPath);
    const full = await derive(src, fullPath, FULL);
    const thumb = await derive(src, thumbPath, THUMB);
    if (!before) encoded += 1;
    bytes += (await stat(fullPath)).size + (await stat(thumbPath)).size;

    photos.push({
      id: `${slug}-${base}`,
      src: `/images/gallery/${slug}/${path.basename(fullPath)}`,
      thumb: `/images/gallery/${slug}/${path.basename(thumbPath)}`,
      width: full.width,
      height: full.height,
      thumbWidth: thumb.width,
      thumbHeight: thumb.height,
    });
  }

  manifest.push({ slug, title: titleFrom(slug), photos });
}

manifest.sort((a, b) => {
  const ia = ALBUM_ORDER.indexOf(a.slug);
  const ib = ALBUM_ORDER.indexOf(b.slug);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || natural(a.title, b.title);
});

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

const total = manifest.reduce((n, a) => n + a.photos.length, 0);
console.log(`albums:   ${manifest.length}`);
for (const a of manifest) console.log(`  ${a.slug.padEnd(24)} ${String(a.photos.length).padStart(3)} photos`);
console.log(`photos:   ${total}`);
console.log(`encoded:  ${encoded} newly (rest already current)`);
console.log(`derived:  ${(bytes / 1024 / 1024).toFixed(1)} MB in ${OUT_DIR}/`);
console.log(`manifest: ${MANIFEST}`);
if (loose.length) {
  console.log(`\nnot in an album (skipped): ${loose.length}`);
  for (const f of loose) console.log(`  ${f}`);
}
