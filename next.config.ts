import { execSync } from "node:child_process"
import type { NextConfig } from "next"

// x-release-please-start-version
const APP_VERSION = "1.6.0"
// x-release-please-end-version

let gitCommitSHA = "dev"
console.log(`APP_ENV: ${process.env.APP_ENV}`)
if (process.env.APP_ENV !== "development") {
  try {
    gitCommitSHA = execSync("git rev-parse --short HEAD")
      .toString()
      .trim()
      .substring(0, 7)
  } catch (error) {
    console.error("Error getting git commit SHA:", error)
  }
}
const fqAppVersion = `v${APP_VERSION}-${gitCommitSHA}`
console.log(`NEXT_PUBLIC_APP_VERSION: ${fqAppVersion}`)

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: fqAppVersion,
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV,
  },
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*"],
  },
  // Minimize output size using webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Optimize server-side bundle size specifically for Cloudflare
      config.optimization = {
        ...config.optimization,
        minimize: true, // Minimize the server-side code
        sideEffects: true, // Enable sideEffects for better tree-shaking
      }
    }
    return config
  },
  experimental: {
    // Keep essential features, disable others that might increase bundle size
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverSourceMaps: false,
    typedRoutes: true,
    reactCompiler: true,
    // Minimize output
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@tabler/icons-react',
      'lucide-react',
      'date-fns',
    ],
  },
  poweredByHeader: false,
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer(nextConfig)

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()
