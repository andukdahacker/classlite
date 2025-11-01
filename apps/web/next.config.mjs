/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/types"],
  devIndicators: false,
};

export default nextConfig;
