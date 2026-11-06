import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  allowedDevOrigins: [
    "192.168.0.117",
    "192.168.0.117:3000",
    "192.168.1.194",
    "192.168.1.194:3000",
    "192.168.100.245",
    "192.168.100.245:3000",
    "192.168.100.34",
    "192.168.100.34:3000",
    "localhost",
    "localhost:3000",
  ],
};

export default nextConfig;
