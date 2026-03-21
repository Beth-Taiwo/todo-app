/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // firebase-admin uses Node.js built-ins (node:fs, node:http, etc.) and must
    // never be bundled by webpack. Marking it external ensures it is required at
    // runtime in the Node.js server process only (API routes, Server Components).
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

export default nextConfig;
