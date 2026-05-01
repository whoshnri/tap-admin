// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com"
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com"
      },
      {
        protocol: "https",
        hostname: "cdn.beacons.ai"
      },
      {
        protocol: "https",
        hostname: "iili.io"
      },
      {
        protocol: "https",
        hostname: "theafricanparent-pull-zone.b-cdn.net"
      },
      {
        protocol: "https",
        hostname: "file-hosting.theafricanparent.org"
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    webpackMemoryOptimizations: true,
    optimizePackageImports: ["@blocknote/react", "@blocknote/core", "@blocknote/mantine"],
  },
  /* transpilePackages: ["@blocknote/react", "@blocknote/core", "@blocknote/mantine"], */
};

export default nextConfig;
