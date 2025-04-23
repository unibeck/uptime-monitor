import { useDrizzle } from "@/db"
import { takeUniqueOrThrow } from "@/db"
import { endpointMonitorsTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * POST /api/endpoint-monitors/[id]/init-do
 *
 * Initializes a new Monitor DO for a specific endpointMonitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response confirming the Monitor DO has been initialized
 */
export const POST = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const endpointMonitor = await db
      .select()
      .from(endpointMonitorsTable)
      .where(eq(endpointMonitorsTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    await env.MONITOR_TRIGGER_RPC.init(endpointMonitor.id, endpointMonitor.checkInterval)

    return NextResponse.json(
      { message: "Initialized Monitor DO" },
      { status: HttpStatusCodes.OK },
    )
  })
