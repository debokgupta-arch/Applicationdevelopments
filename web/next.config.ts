import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // v1 used /sign-in; keep old links and bookmarks working.
  redirects: async () => [{ source: "/sign-in", destination: "/login", permanent: true }],
};

export default nextConfig;
