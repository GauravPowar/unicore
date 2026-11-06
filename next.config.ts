import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents + partialPrefetching are Next.js 16 features that conflict
  // with `export const dynamic` route segment config. Using standard rendering instead.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Allow Supabase Storage and Dicebear avatar domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
