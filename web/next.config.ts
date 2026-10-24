import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Old project URL (pre-rename to Piper) forwards to the new one, keeping path + query.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "rat-ops.vercel.app" }],
        destination: "https://piper-app.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
