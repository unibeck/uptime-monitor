import { useDrizzle } from "@/db"
import { UptimeChecksTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema, timeRangeQuerySchema } from "@/lib/route-schemas"
import { getTimeRangeInMinutes } from "@/lib/uptime-utils"
import type { TimeRange } from "@/types/website"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, desc, eq, gt } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * GET /api/websites/[id]/checks
 * 
 * Retrieves uptime checks for a specific website within a given time range.
 * 
 * @params {string} id - Website ID
 * @query {TimeRange} timeRange - Time range to filter results
 * @returns {Promise<NextResponse>} JSON response with uptime checks
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .query(timeRangeQuerySchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const { timeRange } = context.query

    try {
      // Calculate start time based on time range
      const startTime = new Date()
      startTime.setMinutes(
        startTime.getMinutes() - getTimeRangeInMinutes(timeRange as TimeRange),
      )

      const results = await db
        .select()
        .from(UptimeChecksTable)
        .where(
          and(
            eq(UptimeChecksTable.websiteId, context.params.id),
            gt(UptimeChecksTable.timestamp, startTime),
          ),
        )
        .orderBy(desc(UptimeChecksTable.timestamp))

      return NextResponse.json(results, { status: HttpStatusCodes.OK })
    } catch (error) {
      console.error("Error fetching uptime checks: ", error)
      return NextResponse.json(
        { error: "Failed to fetch uptime checks" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  })
