/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Android emulator / LAN WebView hit the Next host as 10.0.2.2 (or a LAN IP).
  // Without this, soft navigations to /_next/* stall in development.
  allowedDevOrigins: [
    "10.0.2.2",
    ...(process.env.SHELF_DEV_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ],
  images: { unoptimized: true },
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/status-bar",
    "@capacitor/splash-screen",
    "@capacitor/keyboard",
    "@capacitor/haptics",
    "@capacitor/share",
    "@capacitor/browser",
  ],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/my-content/preloaded/:subject/:topic/:article",
        destination: "/learn/:subject/:topic/:article",
        permanent: true,
      },
      {
        source: "/calendar",
        destination: "/planner",
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
