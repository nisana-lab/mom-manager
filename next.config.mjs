import envPkg from "@next/env";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";

const { loadEnvConfig } = envPkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvConfig(__dirname);

const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  cacheOnNavigation: true,
  swUrl: "/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/offline", destination: "/~offline", permanent: false },
    ];
  },
};

export default withSerwist(nextConfig);
