import { useDrizzle } from "@/db"
import { UptimeChecksTable } from "@/db/schema"
import type { uptimeChecksSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, desc, eq, isNotNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { z } from "zod"

const querySchema = z.object({
  limit: z.coerce.number().optional().default(30),
})

/**
 * GET /api/websites/[id]/uptime/limit
 * 
 * Retrieves uptime limit data for a specific website.
 * 
 * @params {string} id - Website ID
 * @query {number} limit - Maximum number of data points to return (default: 30)
 * @returns {Promise<NextResponse>} JSON response with uptime limit data in chronological order
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .query(querySchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const { id: websiteId } = context.params
    const { limit } = context.query

    try {
      const results: z.infer<typeof uptimeChecksSelectSchema>[] = await db
        .select()
        .from(UptimeChecksTable)
        .where(
          and(
            eq(UptimeChecksTable.websiteId, websiteId),
            isNotNull(UptimeChecksTable.responseTime),
          ),
        )
        .orderBy(UptimeChecksTable.timestamp)
        .limit(limit)

      console.log(`Uptime data for website [${websiteId}] with limit [${limit}]: ${results.length}`)
      return NextResponse.json(results, { status: HttpStatusCodes.OK })
    } catch (error) {
      console.error("Error fetching latency data: ", error)
      return NextResponse.json(
        { error: "Failed to fetch latency data" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }
  }) 