const withTM = require("next-transpile-modules")(["react-haiku", "next-pwa"]);

// Next automatically loads `.env` for server-side code. We intentionally do NOT
// expose the whole `.env` to the bundle: only `NEXT_PUBLIC_*` vars reach the client.
module.exports = withTM({
  reactStrictMode: true,
  images: {
    domains: ["s.ppy.sh", "a.ppy.sh"],
    formats: ["image/avif", "image/webp"],
  },
});
