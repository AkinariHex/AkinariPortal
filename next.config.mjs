/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-haiku"],
  // TypeScript 7 (tsgo) dropped the programmatic compiler API Next used; run the
  // TS CLI for type-checking during build instead.
  experimental: {
    useTypeScriptCli: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "s.ppy.sh" },
      { protocol: "https", hostname: "a.ppy.sh" },
    ],
  },
};

export default nextConfig;
