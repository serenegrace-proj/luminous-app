/** @type {import('next').NextConfig} */
const repoName = "luminous-app";

const nextConfig = {
  output: "export",
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Exposed so client code can prefix public/ asset URLs itself — plain
  // <img> tags aren't basePath-aware the way next/image or next/link are.
  env: {
    NEXT_PUBLIC_BASE_PATH: `/${repoName}`,
  },
};

export default nextConfig;
