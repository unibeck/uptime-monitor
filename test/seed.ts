import fs from "node:fs"
import path from "node:path"
import { createId } from "@/lib/ids"
import { PRE_ID } from "@/lib/ids"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { reset, seed } from "drizzle-seed"
import type { z } from "zod"
import * as schema from "../src/db/schema"
import { UptimeChecksTable } from "../src/db/schema"
import type {
  uptimeChecksInsertSchema,
  websitesInsertSchema,
} from "../src/db/zod-schema"

// List of 23 predefined URLs for websites
const websiteUrls = [
  "https://cloudflare.com",
  "https://workers.cloudflare.com",
  "https://developers.cloudflare.com",
  "https://pages.cloudflare.com",
  "https://dash.cloudflare.com",
  "https://blog.cloudflare.com",
  "https://community.cloudflare.com",
  "https://www.google.com",
  "https://www.github.com",
  "https://www.microsoft.com",
  "https://www.amazon.com",
  "https://www.netflix.com",
  "https://www.twitter.com",
  "https://www.facebook.com",
  "https://www.instagram.com",
  "https://www.linkedin.com",
  "https://www.reddit.com",
  "https://www.wikipedia.org",
  "https://www.apple.com",
  "https://www.youtube.com",
  "https://www.twitch.tv",
  "https://www.discord.com",
  "https://www.slack.com",
]

// Check intervals in seconds
const checkIntervals = [30, 60, 120]

const seedDatabase = async () => {
  const pathToDb = getLocalD1DB()
  if (!pathToDb) {
    console.error("❌ Could not find local D1 database")
    process.exit(1)
  }

  const client = createClient({
    url: `file:${pathToDb}`,
  })
  const db = drizzle(client)

  console.log("Resetting database...")
  await reset(db, schema)

  console.log("Seeding database...")
  try {
    console.log("Seeding websites...")
    // Create 23 websites with predefined URLs
    const seedWebsites = websiteUrls.map((url) => {
      const domain = new URL(url).hostname.replace("www.", "")
      return {
        id: createId(PRE_ID.website),
        url: url,
        name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Website`,
        checkInterval:
          checkIntervals[Math.floor(Math.random() * checkIntervals.length)],
      }
    })
    await db.insert(schema.WebsitesTable).values(seedWebsites)

    console.log("Seeding uptime checks...")
    // Create historical uptime checks for each website
    const now = new Date()
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago

    for (const website of seedWebsites) {
      const checksToCreate = Math.floor(Math.random() * 201) + 100 // Random number between 100-300
      const timeSpan = now.getTime() - twoWeeksAgo.getTime()
      const checksPerInterval = timeSpan / (website.checkInterval * 1000)
      const skipFactor = Math.floor(checksPerInterval / checksToCreate)

      const uptimeChecks: z.infer<typeof uptimeChecksInsertSchema>[] =
        Array.from({ length: checksToCreate }, (_, i) => {
          const timestamp = new Date(
            twoWeeksAgo.getTime() +
              i * skipFactor * website.checkInterval * 1000,
          )

          // 95% chance of success
          const isSuccess = Math.random() < 0.95

          // 100-1000ms for success, 15000 second timeout for failure
          const responseTime = isSuccess
            ? Math.floor(Math.random() * 900) + 100
            : 15000

          return {
            websiteId: website.id,
            timestamp,
            isUp: isSuccess,
            status: isSuccess ? 200 : 504,
            responseTime,
          }
        })

      // Insert checks in chunks to avoid SQLite limits
      const chunkSize = 100
      for (let i = 0; i < uptimeChecks.length; i += chunkSize) {
        const chunk = uptimeChecks.slice(i, i + chunkSize)
        await db.insert(UptimeChecksTable).values(chunk)
      }
    }

    console.log("✅ Database seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    client.close()
  }
}

seedDatabase()

function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler")
    const files = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .filter((f) => f.endsWith(".sqlite"))

    files.sort((a, b) => {
      const statA = fs.statSync(path.join(basePath, a))
      const statB = fs.statSync(path.join(basePath, b))
      return statB.mtime.getTime() - statA.mtime.getTime()
    })
    const dbFile = files[0]

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`)
    }

    return path.resolve(basePath, dbFile)
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error resolving local D1 DB: ${err.message}`)
    } else {
      console.log(`Error resolving local D1 DB: ${err}`)
    }
    return null
  }
}
