import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { UptimeChecksTable } from "@/db/schema"
import type { uptimeChecksSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { desc, eq, } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import type { z } from "zod"

/**
 * GET /api/endpoint-monitors/[id]/uptime
 *
 * Get the latest uptime check for a endpointMonitor
 *
 * @params {string} id - EndpointMonitor ID
 * @returns {Promise<NextResponse>} JSON response with uptime percentage and period
 * @throws {NextResponse} 404 Not Found if no uptime checks found for the endpointMonitor
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const { id: endpointMonitorId } = context.params

    try {
      const result: z.infer<typeof uptimeChecksSelectSchema> = await db
        .select()
        .from(UptimeChecksTable)
        .where(eq(UptimeChecksTable.endpointMonitorId, endpointMonitorId))
        .orderBy(desc(UptimeChecksTable.timestamp))
        .limit(1)
        .then(takeUniqueOrThrow)

      return NextResponse.json(result, { status: HttpStatusCodes.OK })
    } catch (error) {
      console.error(
        `Error getting latest uptime check for endpointMonitor [${endpointMonitorId}]: ${error}`,
      )
      return NextResponse.json(
        { error: "Failed to get latest uptime check" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  })
