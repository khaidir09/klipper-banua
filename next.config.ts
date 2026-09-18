import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Audience proof screenshots (max 5 MB) travel through a Server Action;
      // the default 1 MB limit would reject real phone screenshots. Larger
      // campaign material is uploaded straight to Supabase Storage instead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
