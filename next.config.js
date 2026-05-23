/** @type {import('next').NextConfig} */
const nextConfig = {
  generateEtags: false,
  reactStrictMode: true,

  experimental: {
    // Corrected: turbopack options are now nested
    turbopack: {
      root: '.',
    },

    optimizePackageImports: [
      "framer-motion",
      "jspdf",
      "jspdf-autotable",
    ],
  },

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
};

module.exports = nextConfig;
