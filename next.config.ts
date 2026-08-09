import type { NextConfig } from "next";

/**
 * The site is a fully static export so it can be served by GitHub Pages —
 * no Node server, no database, no hosting cost.
 *
 * NEXT_PUBLIC_BASE_PATH is needed only when the site is served from a
 * sub-path, i.e. https://<user>.github.io/ko-volleyball-web. Leave it empty
 * for a custom domain such as kleinoakvolleyball.com.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: {
    // GitHub Pages cannot run Next's image optimizer.
    unoptimized: true,
  },
};

export default nextConfig;
