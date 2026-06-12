import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "service-worker/index.ts",
  swDest: "public/sw.js",
  // Skip the SW in dev — it caches build output and turns "save and refresh"
  // into a multi-step ritual of clearing storage and re-registering.
  disable: process.env.NODE_ENV === "development",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow Slack CDN avatars
    remotePatterns: [
      { protocol: "https", hostname: "avatars.slack-edge.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
    ],
  },
}

export default withSerwist(nextConfig)
