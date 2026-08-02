import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jopoergjjwdvhvpweayh.supabase.co", // Replace with your actual project ID
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Replace with your actual project ID
      },
    ],
  },
};

export default nextConfig;
