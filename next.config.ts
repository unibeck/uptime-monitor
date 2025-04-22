import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*"],
  },
  experimental: {
    // parallelServerBuildTraces: true,
    // parallelServerCompiles: true,
    // serverSourceMaps: true,
    typedRoutes: true,
    reactCompiler: true,
  },
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer(nextConfig)

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
initOpenNextCloudflareForDev()
