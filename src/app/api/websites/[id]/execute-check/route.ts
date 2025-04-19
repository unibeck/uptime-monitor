import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * GET /api/websites/[id]/execute-check
 * 
 * Manually executes an uptime check for a specific website.
 * 
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response confirming the check execution
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const website = await db
      .select()
      .from(WebsitesTable)
      .where(eq(WebsitesTable.id, context.params.id))
      .then(takeUniqueOrThrow)

    await env.MONITOR_EXEC.executeCheck(website)

    return NextResponse.json(
      { message: "Executed check via DO" },
      { status: HttpStatusCodes.OK },
    )
  })
