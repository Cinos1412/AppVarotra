/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: 'https', hostname: 'img.clerk.com' }
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'ubiquitous-chainsaw-7v5wqr7pg7w4hxvw9-3000.app.github.dev',
        'localhost:3000'
      ],
    },
  },
};

export default nextConfig;