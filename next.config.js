const withTM = require("next-transpile-modules")(["react-haiku"]);
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
});
