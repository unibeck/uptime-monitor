import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, count, eq, like, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"

/**
 * GET /api/endpoint-monitors/count
 *
 * Retrieves the total count of endpointMonitors in the database, subject to optional search and filter parameters.
 *
 * @query {string} search - Optional search term to filter endpointMonitors
 * @query {string} isRunning - Optional filter by running status
 * @query {number} checkIntervalMin - Optional filter by minimum check interval
 * @query {number} checkIntervalMax - Optional filter by maximum check interval
 * @returns {Promise<NextResponse>} JSON response with the total count as a number
 */
const querySchema = z.object({
  search: z.string().optional(),
  isRunning: z.string().optional(),
  checkIntervalMin: z.number().optional(),
  checkIntervalMax: z.number().optional(),
})

export const GET = createRoute
  .query(querySchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const { search, isRunning, checkIntervalMin, checkIntervalMax } =
      context.query

    const { count: totalCount } = await db
      .select({ count: count() })
      .from(EndpointMonitorsTable)
      .where(
        and(
          search
            ? sql`(${like(EndpointMonitorsTable.name, `%${search}%`)} OR ${like(EndpointMonitorsTable.url, `%${search}%`)})`
            : sql`1=1`,
          isRunning !== undefined
            ? eq(EndpointMonitorsTable.isRunning, isRunning === "true")
            : sql`1=1`,
          checkIntervalMin !== undefined
            ? sql`${EndpointMonitorsTable.checkInterval} >= ${checkIntervalMin}`
            : sql`1=1`,
          checkIntervalMax !== undefined
            ? sql`${EndpointMonitorsTable.checkInterval} <= ${checkIntervalMax}`
            : sql`1=1`,
        ),
      )
      .then(takeUniqueOrThrow)

    return NextResponse.json(totalCount)
  })
