import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Turbopack vs webpack config warning; Wasm uses webpack config below.
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
