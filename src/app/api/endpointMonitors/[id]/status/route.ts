import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { endpointMonitorsTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * GET /api/endpointMonitors/[id]/status
 *
 * Retrieves the current monitoring status of a specific endpointMonitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response with the endpointMonitor's running status
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const endpointMonitor = await db
      .select()
      .from(endpointMonitorsTable)
      .where(eq(endpointMonitorsTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    return NextResponse.json(
      { status: endpointMonitor.isRunning },
      { status: HttpStatusCodes.OK },
    )
  })
