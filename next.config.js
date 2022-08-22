const withTM = require("next-transpile-modules")(["react-haiku"]);
module.exports = withTM({
  reactStrictMode: true,
  target: "serverless",
  images: {
    domains: ["s.ppy.sh", "a.ppy.sh"],
    formats: ["image/avif", "image/webp"],
  },
});
