import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qfukpexisxzbuiowslwr.supabase.co", // Replace with your actual project ID
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
