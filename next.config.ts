/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ REQUIRED for PM2 standalone
  output: "standalone",

  reactStrictMode: true,
  compress: true,
  generateEtags: false,

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "jspdf",
      "jspdf-autotable",
    ],
  },
};

export default nextConfig;
