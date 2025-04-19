import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { UptimeChecksTable, WebsitesTable } from "@/db/schema"
import type { uptimeChecksSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { daysQuerySchema, idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, desc, eq, gt, lt, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"
import type { z } from "zod"

/**
 * GET /api/websites/[id]/uptime
 * 
 * Get the latest uptime check for a website
 * 
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response with uptime percentage and period
 * @throws {NextResponse} 404 Not Found if no uptime checks found for the website
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const { id: websiteId } = context.params

    try {
      const result: z.infer<typeof uptimeChecksSelectSchema> = await db
        .select()
        .from(UptimeChecksTable)
        .where(eq(UptimeChecksTable.websiteId, websiteId))
        .orderBy(desc(UptimeChecksTable.timestamp))
        .limit(1)
        .then(takeUniqueOrThrow)

      return NextResponse.json(
        result,
        { status: HttpStatusCodes.OK },
      )
    } catch (error) {
      console.error(`Error getting latest uptime check for website [${websiteId}]: ${error}`)
      return NextResponse.json(
        { error: "Failed to get latest uptime check" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  })
