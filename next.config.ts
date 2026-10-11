import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/ui-05-cyber-visualizer",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
