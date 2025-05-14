import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes"
import { useDrizzle } from "@/db"
import { UptimeChecksTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { daysQuerySchema, idStringParamsSchema } from "@/lib/route-schemas"

/**
 * GET /api/endpoint-monitors/[id]/checks/history
 *
 * Retrieves the history of uptime checks for a specific endpointMonitor within a given time period.
 *
 * @params {string} id - Endpoint Monitor ID
 * @query {number} days - Number of days to look back
 * @returns {Promise<NextResponse>} JSON response with uptime check history
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .query(daysQuerySchema())
  .handler(async (_request, context) => {
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
            eq(UptimeChecksTable.endpointMonitorId, context.params.id),
            sql`${UptimeChecksTable.timestamp} >= ${startDate.toISOString()}`,
          ),
        )
        .orderBy(desc(UptimeChecksTable.timestamp))

      return NextResponse.json(results, { status: OK })
    } catch (error) {
      console.error("Error fetching uptime checks history: ", error)
      return NextResponse.json(
        { error: "Failed to fetch uptime checks history" },
        { status: INTERNAL_SERVER_ERROR },
      )
    }
  })
