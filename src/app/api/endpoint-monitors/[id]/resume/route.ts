import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { getErrorMessage } from "@/lib/errors"
import { MonitorTriggerNotInitializedError } from "@/lib/errors"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { OK } from "stoker/http-status-codes"

/**
 * POST /api/endpoint-monitors/[id]/resume
 *
 * Resumes monitoring for a specific endpointMonitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response confirming the monitoring has been resumed
 */
export const POST = createRoute
  .params(idStringParamsSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    try {
      await env.MONITOR_TRIGGER_RPC.updateCheckInterval(
        endpointMonitor.id,
        endpointMonitor.checkInterval,
      )
      await env.MONITOR_TRIGGER_RPC.resumeDo(endpointMonitor.id)
    } catch (error) {
      const errorMessage = getErrorMessage(error)

      // RPC returns a wrapped, stringified error, so we need to check for the error name
      if (errorMessage.includes(MonitorTriggerNotInitializedError.NAME)) {
        console.log(
          `DO [${endpointMonitor.id}] not initialized. Initializing automatically...`,
        )
        await env.MONITOR_TRIGGER_RPC.init(endpointMonitor.id, endpointMonitor.checkInterval)
      } else {
        throw error
      }
    }

    return NextResponse.json({ message: "Resumed Monitor DO" }, { status: OK })
  })
