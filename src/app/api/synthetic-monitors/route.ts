import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, asc, count, desc, eq, like } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"
import { NextResponse } from "next/server"
import { CREATED, INTERNAL_SERVER_ERROR } from "stoker/http-status-codes"
import { z } from "zod"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { SyntheticMonitorsTable } from "@/db/schema"
import { syntheticMonitorsInsertDTOSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { createId, PRE_ID } from "@/lib/ids"
import { paginationQuerySchema } from "@/lib/route-schemas"

// Define the runtime enum type explicitly
const runtimeEnum = z.enum(["playwright-cf-latest", "puppeteer-cf-latest"])

/**
 * GET /api/synthetic-monitors
 *
 * Retrieves a paginated list of synthetic monitors with ordering options.
 *
 * @query {number} pageSize - Number of items per page
 * @query {number} page - Page number (zero-based)
 * @query {string} orderBy - Column to order by (e.g., name, checkInterval, consecutiveFailures)
 * @query {string} order - Order direction ('asc' or 'desc')
 * @query {string} search - Search term (searches name)
 * @query {string} isRunning - Filter by running status ('true' or 'false')
 * @query {string} runtime - Filter by runtime (e.g., 'playwright-cf-latest')
 * @returns {Promise<NextResponse>} JSON response with paginated synthetic monitors
 */
// Define query schema specific to synthetic monitors
const syntheticMonitorsQuerySchema = paginationQuerySchema().extend({
  search: z.string().optional(),
  isRunning: z.string().optional(), // Keep as string 'true'/'false' for consistency
  runtime: runtimeEnum.optional(), // Use the enum schema here
  // Add other relevant filters if needed (e.g., interval range)
})

export const GET = createRoute
  .query(syntheticMonitorsQuerySchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const {
      pageSize,
      page,
      orderBy: orderByParam,
      order: orderParam,
      search,
      isRunning,
      runtime, // This is now typed as RuntimeEnum | undefined
    } = context.query

    // Set default sorting
    const orderBy = orderByParam ?? "name" // Default sort by name
    const order = orderParam ?? "asc"

    const orderByCol = getSyntheticColumn(orderBy)
    const orderDir = getOrderDirection(order as "asc" | "desc")

    // Create the where conditions
    const whereConditions = and(
      search ? like(SyntheticMonitorsTable.name, `%${search}%`) : undefined,
      isRunning !== undefined
        ? eq(SyntheticMonitorsTable.isRunning, isRunning === "true")
        : undefined,
      // Ensure runtime matches the expected enum type for eq()
      runtime ? eq(SyntheticMonitorsTable.runtime, runtime) : undefined,
    )

    // Get paginated synthetic monitors
    const syntheticMonitors = await db
      .select()
      .from(SyntheticMonitorsTable)
      .where(whereConditions)
      .orderBy(orderDir(orderByCol), asc(SyntheticMonitorsTable.id)) // Secondary sort by ID
      .limit(pageSize)
      .offset(page * pageSize)

    // Get total count with the same filters
    const { count: totalCount } = await db
      .select({ count: count() })
      .from(SyntheticMonitorsTable)
      .where(whereConditions)
      .then(takeUniqueOrThrow)

    // Return synthetic monitors and total count
    return NextResponse.json({
      data: syntheticMonitors,
      totalCount,
    })
  })

/**
 * POST /api/synthetic-monitors
 *
 * Creates a new synthetic monitor entry.
 * Uploads the script to R2.
 * Initializes the corresponding MonitorTrigger DO.
 *
 * @body {syntheticMonitorsInsertDTOSchema} - Synthetic Monitor data to insert (includes scriptContent)
 * @returns {Promise<NextResponse>} JSON response with created monitor
 * @throws {NextResponse} 500 on internal errors
 */
export const POST = createRoute
  .body(syntheticMonitorsInsertDTOSchema) // Use the DTO schema which includes scriptContent and type literal
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    const syntheticMonitorData = context.body

    // Separate script content from data going to DB
    const { scriptContent, ...dbData } = syntheticMonitorData

    // Use the key for createId
    const newMonitorId = createId(PRE_ID.syntheticMonitor)
    const scriptKey = `scripts/synthetic/${newMonitorId}.js`

    try {
      // 1. Upload script to R2
      console.log(`Uploading script to R2: ${scriptKey}`)
      await env.SYNTHETIC_SCRIPTS.put(scriptKey, scriptContent)

      // 2. Insert monitor data into DB
      console.log(`Inserting synthetic monitor [${newMonitorId}] into DB`)
      const newSyntheticMonitor = await db
        .insert(SyntheticMonitorsTable)
        .values({
          // Map validated data to DB schema explicitly
          id: newMonitorId,
          name: dbData.name,
          checkInterval: dbData.checkInterval,
          timeoutSeconds: dbData.timeoutSeconds, // Guaranteed non-null by Zod
          runtime: dbData.runtime, // Guaranteed non-null by Zod
          // Let DB handle defaults for: isRunning, consecutiveFailures, activeAlert, createdAt, updatedAt
        })
        .returning()
        .then(takeUniqueOrThrow)

      // 3. Initialize the MonitorTrigger DO
      console.log(`Initializing DO for synthetic monitor [${newMonitorId}]`)
      await env.MONITOR_TRIGGER_RPC.init({
        monitorId: newSyntheticMonitor.id,
        monitorType: "synthetic",
        checkInterval: newSyntheticMonitor.checkInterval,
        timeoutSeconds: newSyntheticMonitor.timeoutSeconds,
        runtime: newSyntheticMonitor.runtime,
      })

      console.log(`Successfully created synthetic monitor [${newMonitorId}]`)
      return NextResponse.json(newSyntheticMonitor, { status: CREATED })
    } catch (error) {
      console.error(
        `Error creating synthetic monitor [${newMonitorId}]:`,
        error,
      )
      // Attempt cleanup if script upload likely succeeded but subsequent steps failed
      if (error instanceof Error && !error.message.includes("R2 put")) {
        // Heuristic check
        try {
          console.log(`Attempting cleanup of R2 script: ${scriptKey}`)
          await env.SYNTHETIC_SCRIPTS.delete(scriptKey)
          console.log(`Cleaned up R2 script after error: ${scriptKey}`)
        } catch (cleanupError) {
          console.error(
            `Failed to cleanup R2 script [${scriptKey}] after error:`,
            cleanupError,
          )
        }
      }
      return NextResponse.json(
        { error: "Failed to create synthetic monitor" },
        { status: INTERNAL_SERVER_ERROR },
      )
    }
  })

// --- Helper Functions ---

function getOrderDirection(direction: "asc" | "desc") {
  return direction === "desc" ? desc : asc
}

// Helper specifically for SyntheticMonitorsTable columns
function getSyntheticColumn(columnName: string): SQLiteColumn {
  const validColumns: (keyof typeof SyntheticMonitorsTable)[] = [
    "id",
    "name",
    "checkInterval",
    "timeoutSeconds",
    "runtime",
    "isRunning",
    "consecutiveFailures",
    "activeAlert",
    "createdAt",
    "updatedAt",
  ]
  if (
    validColumns.includes(columnName as keyof typeof SyntheticMonitorsTable)
  ) {
    return SyntheticMonitorsTable[
      columnName as keyof typeof SyntheticMonitorsTable
    ] as SQLiteColumn
  }
  // Default or throw error if invalid column name is provided
  console.warn(
    `Invalid orderBy column specified: ${columnName}. Defaulting to 'name'.`,
  )
  return SyntheticMonitorsTable.name
}
