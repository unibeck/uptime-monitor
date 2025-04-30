import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextResponse } from "next/server"
import { OK } from "stoker/http-status-codes"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"

/**
 * POST /api/endpoint-monitors/[id]/pause
 *
 * Pauses monitoring for a specific endpointMonitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response confirming the monitoring has been paused
 */
export const POST = createRoute
  .params(idStringParamsSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    await env.MONITOR_TRIGGER_RPC.pauseDo(context.params.id)

    return NextResponse.json({ message: "Paused Monitor DO" }, { status: OK })
  })
