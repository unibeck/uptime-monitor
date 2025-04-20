import { useDrizzle } from "@/db"
import { takeUniqueOrThrow } from "@/db"
import { WebsitesTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * POST /api/websites/[id]/init-do
 *
 * Initializes a new Monitor DO for a specific website.
 *
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response confirming the Monitor DO has been initialized
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

    await env.MONITOR_TRIGGER_RPC.init(website.id, website.checkInterval)

    return NextResponse.json(
      { message: "Initialized Monitor DO" },
      { status: HttpStatusCodes.OK },
    )
  })
