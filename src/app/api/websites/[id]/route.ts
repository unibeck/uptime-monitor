import { takeFirstOrNull, takeUniqueOrThrow, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import { websitesPatchSchema, type websitesSelectSchema } from "@/db/zod-schema"
import { createRoute } from "@/lib/api-utils"
import { idStringParamsSchema } from "@/lib/route-schemas"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"
import type { z } from "zod"

/**
 * GET /api/websites/[id]
 * 
 * Retrieves a specific website by ID.
 * 
 * @params {string} id - Website ID
 * @returns {Promise<NextResponse>} JSON response with website data
 * @throws {NextResponse} 404 Not Found if website doesn't exist
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .params(idStringParamsSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    let website: z.infer<typeof websitesSelectSchema> | undefined
    try {
      website = await db.query.WebsitesTable.findFirst({
        where: eq(WebsitesTable.id, context.params.id),
      })
    } catch (error) {
      console.error("Error fetching website: ", error)
      // TODO: Use HttpStatusCodes.INTERNAL_SERVER_ERROR
      return NextResponse.json(
        { error: "Failed to fetch website" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }

    if (!website) {
      return NextResponse.json(
        { message: HttpStatusPhrases.NOT_FOUND },
        { status: HttpStatusCodes.NOT_FOUND },
      )
    }

    return NextResponse.json(website)
  })

/**
 * PATCH /api/websites/[id]
 * 
 * Updates a specific website by ID with partial data.
 * 
 * @params {string} id - Website ID
 * @body {websitesPatchSchema} - Partial website data to update
 * @returns {Promise<NextResponse>} JSON response with updated website
 * @throws {NextResponse} 404 Not Found if website doesn't exist
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const PATCH = createRoute
  .params(idStringParamsSchema)
  .body(websitesPatchSchema)
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)

    const website: z.infer<typeof websitesPatchSchema> = context.body
    let updatedWebsite: z.infer<typeof websitesSelectSchema> | undefined | null
    try {
      updatedWebsite = await db
        .update(WebsitesTable)
        .set(website)
        .where(eq(WebsitesTable.id, context.params.id))
        .returning()
        .then(takeFirstOrNull)
    } catch (error) {
      console.error("Error updating website: ", error)
      return NextResponse.json(
        { error: "Failed to update website" },
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

    return NextResponse.json(updatedWebsite, { status: HttpStatusCodes.OK })
  })

/**
 * DELETE /api/websites/[id]
 * 
 * Deletes a specific website by ID and its associated monitor.
 * 
 * @params {string} id - Website ID
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
        .delete(WebsitesTable)
        .where(eq(WebsitesTable.id, context.params.id))

      await env.MONITOR_TRIGGER_RPC.deleteDo(context.params.id)
    } catch (error) {
      console.error("Error deleting website: ", error)
      return NextResponse.json(
        { error: "Failed to delete website" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR },
      )
    }

    return new NextResponse(null, {
      status: 204,
    })
  })
