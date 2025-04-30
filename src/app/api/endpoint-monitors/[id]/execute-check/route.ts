import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { OK } from "stoker/http-status-codes"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"

/**
 * GET /api/endpoint-monitors/[id]/execute-check
 *
 * Manually executes an uptime check for a specific endpointMonitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response confirming the check execution
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    await env.MONITOR_EXEC.executeCheck(endpointMonitor.id)

    return NextResponse.json(
      { message: "Executed check via DO" },
      { status: OK },
    )
  })
