import { takeFirstOrNull, useDrizzle } from "@/db"
import { UptimeChecksTable, WebsitesTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { daysQuerySchema, idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"

/**
 * GET /api/websites/[id]/checks/history
 * 
 * Retrieves the history of uptime checks for a specific website within a given time period.
 * 
 * @params {string} id - Website ID
 * @query {number} days - Number of days to look back
 * @returns {Promise<NextResponse>} JSON response with uptime check history
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .query(daysQuerySchema())
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const { days } = context.query

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const results = await db
        .select()
        .from(UptimeChecksTable)
        .where(
          and(
            eq(UptimeChecksTable.websiteId, context.params.id),
            sql`${UptimeChecksTable.timestamp} >= ${startDate.toISOString()}`,
          ),
        )
        .orderBy(desc(UptimeChecksTable.timestamp))

      return NextResponse.json(results, { status: HttpStatusCodes.OK })
    } catch (error) {
      console.error("Error fetching uptime checks history: ", error)
      return NextResponse.json(
        { error: "Failed to fetch uptime checks history" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  })
