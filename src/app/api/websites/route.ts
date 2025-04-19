import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import {
  websitesInsertDTOSchema,
  type websitesSelectSchema,
} from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { PRE_ID, createId } from "@/lib/ids"
import { paginationQuerySchema } from "@/lib/route-schemas"
import type { ConflictWebsiteResponse } from "@/types/website"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { asc, desc } from "drizzle-orm"
import { and, count, eq, like, sql } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { z } from "zod"

/**
 * GET /api/websites
 * 
 * Retrieves a paginated list of websites with ordering options.
 * 
 * @query {number} pageSize - Number of items per page
 * @query {number} page - Page number (zero-based)
 * @query {string} orderBy - Column to order by
 * @query {string} order - Order direction ('asc' or 'desc')
 * @query {string} search - Search term
 * @query {string} isRunning - Filter by running status
 * @query {number} checkIntervalMin - Minimum check interval
 * @query {number} checkIntervalMax - Maximum check interval
 * @returns {Promise<NextResponse>} JSON response with paginated websites
 */
const extendedQuerySchema = paginationQuerySchema().extend({
  search: z.string().optional(),
  isRunning: z.string().optional(),
  checkIntervalMin: z.number().optional(),
  checkIntervalMax: z.number().optional(),
})

export const GET = createRoute
  .query(extendedQuerySchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const { 
      pageSize, 
      page, 
      orderBy: orderByParam,
      order: orderParam,
      search, 
      isRunning, 
      checkIntervalMin, 
      checkIntervalMax 
    } = context.query

    // Set default sorting if not provided
    const orderBy = orderByParam ?? "consecutiveFailures"
    const order = orderParam ?? "desc"
    
    console.log(pageSize, page, orderBy, order, search, isRunning, checkIntervalMin, checkIntervalMax)

    const orderByCol = getColumn(orderBy)
    const orderDir = getOrderDirection(order as "asc" | "desc")

    // Create the where conditions first so we can reuse them for both queries
    const whereConditions = and(
      search ? sql`(${like(WebsitesTable.name, `%${search}%`)} OR ${like(WebsitesTable.url, `%${search}%`)})` : sql`1=1`,
      isRunning !== undefined ? eq(WebsitesTable.isRunning, isRunning === 'true') : sql`1=1`,
      checkIntervalMin !== undefined ? sql`${WebsitesTable.checkInterval} >= ${checkIntervalMin}` : sql`1=1`,
      checkIntervalMax !== undefined ? sql`${WebsitesTable.checkInterval} <= ${checkIntervalMax}` : sql`1=1`
    )

    // Get paginated websites
    const websites = await db
      .select()
      .from(WebsitesTable)
      .where(whereConditions)
      .orderBy(orderDir(orderByCol), asc(WebsitesTable.id))
      .limit(pageSize)
      .offset(page * pageSize)

    // Get total count with the same filters
    const { count: totalCount } = await db
      .select({ count: count() })
      .from(WebsitesTable)
      .where(whereConditions)
      .then(takeUniqueOrThrow)

    // Return websites and total count
    return NextResponse.json({
      data: websites,
      totalCount
    })
  })

/**
 * POST /api/websites
 * 
 * Creates a new website entry. Checks for URL conflicts before creating.
 * 
 * @body {websitesInsertDTOSchema} - Website data to insert
 * @returns {Promise<NextResponse>} JSON response with created website or conflict error
 * @throws {NextResponse} 409 Conflict if a similar URL already exists
 */
export const POST = createRoute
  .body(websitesInsertDTOSchema)
  .handler(async (request, context) => {
    const website: z.infer<typeof websitesInsertDTOSchema> = context.body

    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    // Normalize the URL to remove the protocol
    const normalizedUrl = website.url.replace(/(^\w+:|^)\/\//, "")
    const existingWebsites: z.infer<typeof websitesSelectSchema>[] = await db
      .select()
      .from(WebsitesTable)
      .where(sql.raw(`instr(url, '${normalizedUrl}') > 0`))

    const matchingWebsite = existingWebsites.find((website) => {
      const websiteUrl = website.url.replace(/(^\w+:|^)\/\//, "")
      return (
        websiteUrl.endsWith(normalizedUrl) || normalizedUrl.endsWith(websiteUrl)
      )
    })

    if (matchingWebsite) {
      console.log(
        `A URL like [${normalizedUrl}] already exists. Original: [${website.url}], Found: [${matchingWebsite.url}]`,
      )
      return NextResponse.json(
        {
          message: `A monitor with a similar URL already exists. ${JSON.stringify({
            provided: website.url,
            searched: normalizedUrl,
            found: matchingWebsite.url,
          })}`,
          matchingWebsite,
        } as const satisfies ConflictWebsiteResponse,
        {
          status: HttpStatusCodes.CONFLICT,
        },
      )
    }

    // TODO: Use a transaction to ensure atomicity between inserting and scheduling
    const newWebsite = await db
      .insert(WebsitesTable)
      .values({
        ...website,
        id: createId(PRE_ID.website),
      })
      .returning()
      .then(takeUniqueOrThrow)

    // Create monitor DO
    await env.MONITOR_TRIGGER_RPC.init(newWebsite.id, newWebsite.checkInterval)

    return NextResponse.json(newWebsite, { status: 201 })
  })

function getOrderDirection(direction: "asc" | "desc") {
  return direction === "desc" ? desc : asc
}

function getColumn(columnName: string): SQLiteColumn {
  return WebsitesTable[columnName as keyof typeof WebsitesTable] as SQLiteColumn
}
