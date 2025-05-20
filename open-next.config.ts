import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache"

// Using the standard KV incremental cache but referencing it directly
// to ensure we don't include anything unnecessary
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
})
