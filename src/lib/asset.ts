const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix a `public/` path with the deployment's base path.
 *
 * `next/image` does not rewrite `src` when the image is `unoptimized`, which it
 * always is here (GitHub Pages cannot run Next's optimizer). So a bare
 * `/images/...` src resolves against the domain root and 404s whenever the site
 * is served from a sub-path — a project site, or a folder inside another Pages
 * repo. Every image src rendered from a literal or from `content/*.json` has to
 * go through this.
 */
export function assetPath(path: string) {
  if (!path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
