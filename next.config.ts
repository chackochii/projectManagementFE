/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent weak ETags (helps with chunk caching issues)
  generateEtags: false,

  // Enable strict production optimizations
  reactStrictMode: true,

  // Production compression
  compress: true,

  // Fix chunk caching + 404 chunk errors
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

  // Prevent stale chunks after deployment
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "jspdf",
      "jspdf-autotable",
    ],
  },
};

export default nextConfig;
