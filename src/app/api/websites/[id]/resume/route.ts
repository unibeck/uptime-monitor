import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { getErrorMessage } from "@/lib/errors"
import { MonitorTriggerNotInitializedError } from "@/lib/errors"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * POST /api/websites/[id]/resume
 *
 * Resumes monitoring for a specific website.
 *
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response confirming the monitoring has been resumed
 */
export const POST = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const website = await db
      .select()
      .from(WebsitesTable)
      .where(eq(WebsitesTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    try {
      await env.MONITOR_TRIGGER_RPC.updateCheckInterval(
        website.id,
        website.checkInterval,
      )
      await env.MONITOR_TRIGGER_RPC.resumeDo(website.id)
    } catch (error) {
      const errorMessage = getErrorMessage(error)

      // RPC returns a wrapped, stringified error, so we need to check for the error name
      if (errorMessage.includes(MonitorTriggerNotInitializedError.NAME)) {
        console.log(
          `DO [${website.id}] not initialized. Initializing automatically...`,
        )
        await env.MONITOR_TRIGGER_RPC.init(website.id, website.checkInterval)
      } else {
        throw error
      }
    }

    return NextResponse.json(
      { message: "Resumed Monitor DO" },
      { status: HttpStatusCodes.OK },
    )
  })
