import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * POST /api/websites/[id]/pause
 * 
 * Pauses monitoring for a specific website.
 * 
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response confirming the monitoring has been paused
 */
export const POST = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    await env.MONITOR_TRIGGER_RPC.pauseDo(context.params.id)

    return NextResponse.json(
      { message: "Paused Monitor DO" },
      { status: HttpStatusCodes.OK },
    )
  })
