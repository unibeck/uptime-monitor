import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import { websitesInsertDTOSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { PRE_ID, createId } from "@/lib/ids"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, count, eq, like, sql } from "drizzle-orm"
import { asc, desc } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"
import { NextResponse } from "next/server"
import { z } from "zod"

/**
 * GET /api/websites/count
 * 
 * Retrieves the total count of websites in the database, subject to optional search and filter parameters.
 * 
 * @query {string} search - Optional search term to filter websites
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
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    
    const { search, isRunning, checkIntervalMin, checkIntervalMax } = context.query

    const { count: totalCount } = await db
      .select({ count: count() })
      .from(WebsitesTable)
      .where(
        and(
          search ? sql`(${like(WebsitesTable.name, `%${search}%`)} OR ${like(WebsitesTable.url, `%${search}%`)})` : sql`1=1`,
          isRunning !== undefined ? eq(WebsitesTable.isRunning, isRunning === 'true') : sql`1=1`,
          checkIntervalMin !== undefined ? sql`${WebsitesTable.checkInterval} >= ${checkIntervalMin}` : sql`1=1`,
          checkIntervalMax !== undefined ? sql`${WebsitesTable.checkInterval} <= ${checkIntervalMax}` : sql`1=1`
        )
      )
      .then(takeUniqueOrThrow)

    return NextResponse.json(totalCount)
  })
