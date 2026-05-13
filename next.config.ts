import type { NextConfig } from "next";

const FRAPPE_URL = process.env.FRAPPE_URL || "http://192.168.1.150:8000";

const nextConfig: NextConfig = {
  // Allow connections from LAN IP for HMR websockets
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.150", "0.0.0.0", "*"],
  // Proxy all API calls to the Frappe backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${FRAPPE_URL}/api/:path*`,
      },
      {
        // Proxy file downloads
        source: "/files/:path*",
        destination: `${FRAPPE_URL}/files/:path*`,
      },
    ];
  },

  // Allow images from the Frappe backend
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
};

export default nextConfig;
