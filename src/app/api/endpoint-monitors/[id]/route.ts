import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { endpointMonitorsTable } from "@/db/schema"
import { endpointMonitorsPatchSchema, type endpointMonitorsSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"
import type { z } from "zod"

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
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    let endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema> | undefined
    try {
      endpointMonitor = await db.query.endpointMonitorsTable.findFirst({
        where: eq(endpointMonitorsTable.id, context.params.id),
      })
    } catch (error) {
      console.error("Error fetching endpointMonitor: ", error)
      // TODO: Use HttpStatusCodes.INTERNAL_SERVER_ERROR
      return NextResponse.json(
        { error: "Failed to fetch endpointMonitor" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }

    if (!endpointMonitor) {
      return NextResponse.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        { status: HttpStatusCodes.NOT_FOUND },
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
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const endpointMonitor: z.infer<typeof endpointMonitorsPatchSchema> = context.body
    let updatedWebsite: z.infer<typeof endpointMonitorsSelectSchema> | undefined | null
    try {
      updatedWebsite = await db
        .update(endpointMonitorsTable)
        .set(endpointMonitor)
        .where(eq(endpointMonitorsTable.id, context.params.id))
        .returning()
        .then(takeUniqueOrThrow)
    } catch (error) {
      console.error("Error updating endpointMonitor: ", error)
      return NextResponse.json(
        { error: "Failed to update endpointMonitor" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }

    if (!updatedWebsite) {
      return NextResponse.json(
        {
          message: HttpStatusPhrases.NOT_FOUND,
        },
        { status: HttpStatusCodes.NOT_FOUND },
      )
    }

    console.log(
      `Updating check interval for [${updatedWebsite.id}] to [${updatedWebsite.checkInterval}]`,
    )
    await env.MONITOR_TRIGGER_RPC.updateCheckInterval(
      updatedWebsite.id,
      updatedWebsite.checkInterval,
    )

    return NextResponse.json(updatedWebsite, { status: HttpStatusCodes.OK })
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
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    try {
      await db
        .delete(endpointMonitorsTable)
        .where(eq(endpointMonitorsTable.id, context.params.id))

      await env.MONITOR_TRIGGER_RPC.deleteDo(context.params.id)
    } catch (error) {
      console.error("Error deleting endpointMonitor: ", error)
      return NextResponse.json(
        { error: "Failed to delete endpointMonitor" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }

    return new NextResponse(null, {
      status: 204,
    })
  })
