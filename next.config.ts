import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // HTML documents only — never the static assets, fonts or images,
        // which must stay cacheable.
        source: "/:path((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            // Keeps a signed-in page out of the browser's back/forward cache,
            // so the Back button can never restore a logged-in view.
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
