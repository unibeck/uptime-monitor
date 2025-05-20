import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache"

export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  // Optimize for smaller bundle size
  buildOptions: {
    minify: true,
    bundle: true,
    // Split code into smaller chunks
    splitting: true,
    // Exclude test files and development tools
    exclude: ['**/*.test.*', '**/*.spec.*', '**/test/**'],
    // Remove code that's only used in development
    treeshake: true,
    // Minimize dependencies
    external: [
      // External modules that should not be bundled
      '@scalar/nextjs-openapi',
    ],
  },
})
