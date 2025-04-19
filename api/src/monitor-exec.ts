import { WorkerEntrypoint } from "cloudflare:workers"
import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { UptimeChecksTable, WebsitesTable } from "@/db/schema"
import type * as schema from "@/db/schema"
import type { websitesPatchSchema, websitesSelectSchema } from "@/db/zod-schema"
import { createWebsiteDownAlert } from "@/lib/opsgenie"
import { eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"
import type { z } from "zod"

export default class MonitorExec extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(request: Request) {
    //Use service or RPC binding to work with the Monitor Durable Object
    return new Response(
      `${HttpStatusPhrases.OK}\nMonitorExec: Use service or RPC binding to work with the Monitor Durable Object`,
      { status: HttpStatusCodes.OK },
    )
  }

  //waitUntil is used to avoid immediately return a response so that the durable object is not charged for wall time
  async executeCheck(websiteId: string) {
    this.ctx.waitUntil(this._executeCheck(websiteId))
  }

  private async _executeCheck(websiteId: string) {
    const db = useDrizzle(this.env.DB)
    const website = await db
      .select()
      .from(WebsitesTable)
      .where(eq(WebsitesTable.id, websiteId))
      .then(takeUniqueOrThrow)

    console.log(`Performing check for ${website.name} (${website.url})`)
    let isUp = false
    let responseTime = 0
    let status = 0
    let errorMessage = ""
    const startTime = Date.now()

    try {
      const response = await fetch(website.url, {
        method: "GET",
        redirect: "follow",
        cf: {
          cacheTTL: 0,
          cacheEverything: false,
        },
      })

      responseTime = Date.now() - startTime
      status = response.status
      // Use expectedStatusCode if provided, otherwise default to 2xx/3xx
      isUp =
        website.expectedStatusCode != null
          ? response.status === website.expectedStatusCode
          : response.status >= 200 && response.status < 400
      console.log(
        `Check complete - Status: ${status}, Response Time: ${responseTime}ms, Up: ${isUp}`,
      )
    } catch (error) {
      responseTime = Date.now() - startTime
      isUp = false
      errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error performing check:", errorMessage)
    }

    // Store check result
    try {
      await db.insert(UptimeChecksTable).values({
        websiteId: website.id,
        timestamp: new Date(),
        status,
        responseTime,
        isUp,
      })
    } catch (error) {
      console.error("Error storing check result: ", error)
    }

    await handleFailureTracking(
      isUp,
      status,
      errorMessage,
      website,
      db,
      this.env.OPSGENIE_API_KEY,
    )
  }

  async testSendAlert(websiteId: string, status: number, errorMessage: string) {
    console.log(this.env.ENVIRONMENT)
    const db = useDrizzle(this.env.DB)

    const website = await db
      .select()
      .from(WebsitesTable)
      .where(eq(WebsitesTable.id, websiteId))
      .then(takeFirstOrNull)
    if (!website) {
      throw new Error(`Website [${websiteId}] does not exist`)
    }

    await sendAlert(status, errorMessage, website, this.env.OPSGENIE_API_KEY)
  }
}

async function handleFailureTracking(
  isUp: boolean,
  status: number,
  errorMessage: string,
  website: z.infer<typeof websitesSelectSchema>,
  db: DrizzleD1Database<typeof schema>,
  opsgenieApiKey: string,
) {
  if (isUp) {
    // Reset consecutive failures if the check passes
    if (website.consecutiveFailures > 0) {
      await db
        .update(WebsitesTable)
        .set({ consecutiveFailures: 0 })
        .where(eq(WebsitesTable.id, website.id))
    }
  } else {
    const consecutiveFailures = website.consecutiveFailures + 1
    console.log(
      `Website ${website.name} has ${consecutiveFailures} consecutive failures`,
    )

    const websitePatch: z.infer<typeof websitesPatchSchema> = {
      consecutiveFailures: consecutiveFailures,
    }

    // Send alert if this is the second consecutive failure and no alert has been sent yet
    if (consecutiveFailures >= 2 && !website.activeAlert) {
      await sendAlert(status, errorMessage, website, opsgenieApiKey)
      websitePatch.activeAlert = true
    }

    await db
      .update(WebsitesTable)
      .set(websitePatch)
      .where(eq(WebsitesTable.id, website.id))
  }
}

async function sendAlert(
  status: number,
  errorMessage: string,
  website: z.infer<typeof websitesSelectSchema>,
  opsgenieApiKey: string,
) {
  if (!opsgenieApiKey) {
    console.error("OPSGENIE_API_KEY is not set, cannot send alert")
    return
  }

  console.log(
    `Sending alert for website ${website.name} after consecutive failures`,
  )

  try {
    const result = await createWebsiteDownAlert(
      opsgenieApiKey,
      website.name,
      website.url,
      status,
      errorMessage,
    )

    if (result) {
      console.log(
        `Alert sent successfully for ${website.name}. RequestId: ${result.requestId}`,
      )
    } else {
      console.error(`Failed to send alert for ${website.name}`)
    }
  } catch (error) {
    console.error(`Error sending alert for ${website.name}:`, error)
  }
}
