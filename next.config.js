/* const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
}); */
const withTM = require("next-transpile-modules")(["react-haiku", "next-pwa"]);
const path = require("path");
const { parsed: localEnv } = require("dotenv-safe").config({
  allowEmptyValues: false,
  path: path.resolve(__dirname, `.env`),
});

module.exports = withTM({
  reactStrictMode: true,
  images: {
    domains: ["s.ppy.sh", "a.ppy.sh"],
    formats: ["image/avif", "image/webp"],
  },
  env: localEnv,
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
});
