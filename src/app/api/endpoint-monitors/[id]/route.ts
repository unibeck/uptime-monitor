import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "stoker/http-status-codes"
import { NOT_FOUND as NOT_FOUND_PHRASE } from "stoker/http-status-phrases"
import type { z } from "zod"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable } from "@/db/schema"
import {
  endpointMonitorsPatchSchema,
  type endpointMonitorsSelectSchema,
} from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"

/**
 * GET /api/endpoint-monitors/[id]
 *
 * Retrieves a specific endpointMonitor by ID.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} JSON response with endpointMonitor data
 * @throws {NextResponse} 404 Not Found if endpointMonitor doesn't exist
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    let endpointMonitor:
      | z.infer<typeof endpointMonitorsSelectSchema>
      | undefined
    try {
      endpointMonitor = await db.query.EndpointMonitorsTable.findFirst({
        where: eq(EndpointMonitorsTable.id, context.params.id),
      })
    } catch (error) {
      console.error("Error fetching endpointMonitor: ", error)
      // TODO: Use HttpStatusCodes.INTERNAL_SERVER_ERROR
      return NextResponse.json(
        { error: "Failed to fetch endpointMonitor" },
        { status: INTERNAL_SERVER_ERROR },
      )
    }

    if (!endpointMonitor) {
      return NextResponse.json(
        { message: NOT_FOUND_PHRASE },
        { status: NOT_FOUND },
      )
    }

    return NextResponse.json(endpointMonitor)
  })

/**
 * PATCH /api/endpoint-monitors/[id]
 *
 * Updates a specific endpointMonitor by ID with partial data.
 *
 * @params {string} id - Endpoint Monitor ID
 * @body {websitesPatchSchema} - Partial endpointMonitor data to update
 * @returns {Promise<NextResponse>} JSON response with updated endpointMonitor
 * @throws {NextResponse} 404 Not Found if endpointMonitor doesn't exist
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const PATCH = createRoute
  .params(idStringParamsSchema)
  .body(endpointMonitorsPatchSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const endpointMonitor: z.infer<typeof endpointMonitorsPatchSchema> =
      context.body
    let updatedWebsite:
      | z.infer<typeof endpointMonitorsSelectSchema>
      | undefined
      | null
    try {
      updatedWebsite = await db
        .update(EndpointMonitorsTable)
        .set(endpointMonitor)
        .where(eq(EndpointMonitorsTable.id, context.params.id))
        .returning()
        .then(takeUniqueOrThrow)
    } catch (error) {
      console.error("Error updating endpointMonitor: ", error)
      return NextResponse.json(
        { error: "Failed to update endpointMonitor" },
        { status: INTERNAL_SERVER_ERROR },
      )
    }

    if (!updatedWebsite) {
      return NextResponse.json(
        {
          message: NOT_FOUND_PHRASE,
        },
        { status: NOT_FOUND },
      )
    }

    console.log(
      `Updating check interval for [${updatedWebsite.id}] to [${updatedWebsite.checkInterval}]`,
    )
    await env.MONITOR_TRIGGER_RPC.updateCheckInterval(
      updatedWebsite.id,
      updatedWebsite.checkInterval,
    )

    return NextResponse.json(updatedWebsite, { status: OK })
  })

/**
 * DELETE /api/endpoint-monitors/[id]
 *
 * Deletes a specific endpointMonitor by ID and its associated monitor.
 *
 * @params {string} id - Endpoint Monitor ID
 * @returns {Promise<NextResponse>} Empty response with 204 No Content status
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const DELETE = createRoute
  .params(idStringParamsSchema)
  .handler(async (_request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    try {
      await db
        .delete(EndpointMonitorsTable)
        .where(eq(EndpointMonitorsTable.id, context.params.id))

      await env.MONITOR_TRIGGER_RPC.deleteDo(context.params.id)
    } catch (error) {
      console.error("Error deleting endpointMonitor: ", error)
      return NextResponse.json(
        { error: "Failed to delete endpointMonitor" },
        { status: INTERNAL_SERVER_ERROR },
      )
    }

    return new NextResponse(null, {
      status: 204,
    })
  })
