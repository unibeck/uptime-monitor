import { useDrizzle } from "@/db"
import { UptimeChecksTable } from "@/db/schema"
import type { uptimeChecksSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { subDays, subHours, subWeeks } from "date-fns"
import { and, eq, gt, isNotNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { z } from "zod"

const querySchema = z.object({
  range: z.enum(["1h", "1d", "7d"]).default("1h"),
})

/**
 * GET /api/websites/[id]/uptime/range
 * 
 * Retrieves uptime data for a specific website within a given time range.
 * 
 * @params {string} id - Website ID
 * @query {string} range - Time range ('1h', '1d', '7d', default: '1h')
 * @returns {Promise<NextResponse>} JSON response with uptime data
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .query(querySchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const { id: websiteId } = context.params
    const { range } = context.query

    const now = new Date()
    let startTime: Date
    switch (range) {
      case "1d":
        startTime = subDays(now, 1)
        break
      case "7d":
        startTime = subWeeks(now, 1)
        break
      default:
        startTime = subHours(now, 1)
        break
    }

    try {
      const results: z.infer<typeof uptimeChecksSelectSchema>[] = await db
        .select()
        .from(UptimeChecksTable)
        .where(
          and(
            eq(UptimeChecksTable.websiteId, websiteId),
            gt(UptimeChecksTable.timestamp, startTime)
          ),
        )
        .orderBy(UptimeChecksTable.timestamp)

      console.log(`Uptime checks in range [${range}] for website [${websiteId}]: ${results.length}`)
      return NextResponse.json(results, { status: HttpStatusCodes.OK })
    } catch (error) {
      console.error("Error fetching uptime data: ", error)
      return NextResponse.json(
        { error: "Failed to fetch uptime data" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  }) 