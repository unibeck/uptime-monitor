import { WorkerEntrypoint } from "cloudflare:workers"
import { takeFirstOrNull, useDrizzle } from "@/db"
import { EndpointMonitorsTable, UptimeChecksTable } from "@/db/schema"
import type { schema } from "@/db/schema"
import type {
  endpointMonitorsPatchSchema,
  endpointMonitorsSelectSchema,
} from "@/db/zod-schema"
import { endpointSignature } from "@/lib/formatters"
import { PRE_ID } from "@/lib/ids"
import { createEndpointMonitorDownAlert } from "@/lib/opsgenie"
import { eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { OK } from "stoker/http-status-codes"
import { OK as OK_PHRASE } from "stoker/http-status-phrases"
import type { z } from "zod"

export default class MonitorExec extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(_request: Request) {
    //Use service or RPC binding to work with the Monitor Durable Object
    return new Response(
      `${OK_PHRASE}\nMonitorExec: Use service or RPC binding to work with the Monitor Durable Object`,
      { status: OK },
    )
  }

  //waitUntil is used to avoid immediately return a response so that the durable object is not charged for wall time
  async executeCheck(endpointMonitorId: string) {
    this.ctx.waitUntil(this._executeCheck(endpointMonitorId))
  }

  private async _executeCheck(endpointMonitorId: string) {
    const db = useDrizzle(this.env.DB)
    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .then(takeFirstOrNull)

    if (!endpointMonitor) {
      console.error(
        `EndpointMonitor [${endpointMonitorId}] does not exist. Deleting Durable Object...`,
      )
      await this.env.MONITOR_TRIGGER_RPC.deleteDo(endpointMonitorId)

      // TODO: Remove this migration logic after some time/versions have passed
      if (endpointMonitorId.includes("webs_")) {
        console.log(
          `[${endpointMonitorId}] is an obsolete website monitor id and needs to be updated . Will attempt to migrate to a new DO...`,
        )

        const newEndpointMonitorId = endpointMonitorId.replace(
          "webs_",
          PRE_ID.endpointMonitor,
        )
        const newEndpointMonitor = await db
          .select()
          .from(EndpointMonitorsTable)
          .where(eq(EndpointMonitorsTable.id, newEndpointMonitorId))
          .then(takeFirstOrNull)

        if (!newEndpointMonitor) {
          console.error(
            `EndpointMonitor [${newEndpointMonitorId}] does not exist. Migration failed.`,
          )
          return
        }

        console.log(
          `Found updated EndpointMonitor ${endpointSignature(newEndpointMonitor)} for obsolete [${endpointMonitorId}]. Initializing new DO...`,
        )
        await this.env.MONITOR_TRIGGER_RPC.init(
          newEndpointMonitor.id,
          newEndpointMonitor.checkInterval,
        )

        console.log(
          `Successfully migrated [${endpointMonitorId}] to [${newEndpointMonitor.id}]`,
        )
      }
      return
    }

    console.log(`${endpointSignature(endpointMonitor)}: performing check...`)
    let isExpectedStatus = false
    let responseTime = 0
    let status = 0
    let errorMessage = ""
    const startTime = Date.now()

    try {
      const response = await fetch(endpointMonitor.url, {
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
      isExpectedStatus =
        endpointMonitor.expectedStatusCode != null
          ? response.status === endpointMonitor.expectedStatusCode
          : response.status >= 200 && response.status < 400
      console.log(
        `${endpointSignature(endpointMonitor)}: check complete. Status: ${status}, Response Time: ${responseTime}ms, ExpectedStatus: ${isExpectedStatus}`,
      )
    } catch (error) {
      responseTime = Date.now() - startTime
      isExpectedStatus = false
      errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error performing check:", errorMessage)
    }

    // Store check result
    try {
      await db.insert(UptimeChecksTable).values({
        endpointMonitorId: endpointMonitor.id,
        timestamp: new Date(),
        status,
        responseTime,
        isExpectedStatus,
      })
    } catch (error) {
      console.error("Error storing check result: ", error)
    }

    await handleFailureTracking(
      isExpectedStatus,
      status,
      errorMessage,
      endpointMonitor,
      db,
      this.env.OPSGENIE_API_KEY,
    )
  }

  async testSendAlert(
    endpointMonitorId: string,
    status: number,
    errorMessage: string,
  ) {
    console.log(this.env.APP_ENV)
    const db = useDrizzle(this.env.DB)

    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .then(takeFirstOrNull)
    if (!endpointMonitor) {
      throw new Error(`EndpointMonitor [${endpointMonitorId}] does not exist`)
    }

    await sendAlert(
      status,
      errorMessage,
      endpointMonitor,
      this.env.OPSGENIE_API_KEY,
    )
  }
}

async function handleFailureTracking(
  isExpectedStatus: boolean,
  status: number,
  errorMessage: string,
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>,
  db: DrizzleD1Database<typeof schema>,
  opsgenieApiKey: string,
) {
  if (isExpectedStatus) {
    // Reset consecutive failures if the check passes
    if (endpointMonitor.consecutiveFailures > 0) {
      await db
        .update(EndpointMonitorsTable)
        .set({ consecutiveFailures: 0 })
        .where(eq(EndpointMonitorsTable.id, endpointMonitor.id))
    }
  } else {
    const consecutiveFailures = endpointMonitor.consecutiveFailures + 1
    console.log(
      `${endpointSignature(endpointMonitor)} has ${consecutiveFailures} consecutive failures`,
    )

    const endpointMonitorPatch: z.infer<typeof endpointMonitorsPatchSchema> = {
      consecutiveFailures: consecutiveFailures,
    }

    // Send alert if this is the second consecutive failure and no alert has been sent yet
    if (consecutiveFailures >= 2 && !endpointMonitor.activeAlert) {
      await sendAlert(status, errorMessage, endpointMonitor, opsgenieApiKey)
      endpointMonitorPatch.activeAlert = true
    }

    await db
      .update(EndpointMonitorsTable)
      .set(endpointMonitorPatch)
      .where(eq(EndpointMonitorsTable.id, endpointMonitor.id))
  }
}

async function sendAlert(
  status: number,
  errorMessage: string,
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>,
  opsgenieApiKey: string,
) {
  if (!opsgenieApiKey) {
    console.error("OPSGENIE_API_KEY is not set, cannot send alert")
    return
  }

  console.log(
    `${endpointSignature(endpointMonitor)}: consecutive failures threshold reached, sending alert...`,
  )

  try {
    const result = await createEndpointMonitorDownAlert(
      opsgenieApiKey,
      endpointMonitor.name,
      endpointMonitor.url,
      status,
      errorMessage,
    )

    if (result) {
      console.log(
        `${endpointSignature(endpointMonitor)}: alert sent successfully. RequestId: ${result.requestId}`,
      )
    } else {
      console.error(
        `${endpointSignature(endpointMonitor)}: failed to send alert`,
      )
    }
  } catch (error) {
    console.error(
      `${endpointSignature(endpointMonitor)}: error sending alert.`,
      error,
    )
  }
}
