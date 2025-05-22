import { getCloudflareContext } from "@opennextjs/cloudflare"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "stoker/http-status-codes"
import { NOT_FOUND as NOT_FOUND_PHRASE } from "stoker/http-status-phrases"
import type { z } from "zod"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable, EndpointMonitorEmailChannelsTable } from "@/db/schema" // Added EndpointMonitorEmailChannelsTable
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
    const { env } = getCloudflareContext();
    const db = useDrizzle(env.DB);
    const monitorId = context.params.id;

    let endpointMonitorData: z.infer<typeof endpointMonitorsSelectSchema> & { emailChannelIds?: string[] } | undefined;

    try {
      const monitor = await db.query.EndpointMonitorsTable.findFirst({
        where: eq(EndpointMonitorsTable.id, monitorId),
      });

      if (!monitor) {
        return NextResponse.json(
          { message: NOT_FOUND_PHRASE },
          { status: NOT_FOUND }
        );
      }

      // Fetch associated email channel IDs
      const emailChannelLinks = await db
        .select({ emailChannelId: EndpointMonitorEmailChannelsTable.emailChannelId })
        .from(EndpointMonitorEmailChannelsTable)
        .where(eq(EndpointMonitorEmailChannelsTable.endpointMonitorId, monitorId));

      const emailChannelIds = emailChannelLinks.map(link => link.emailChannelId);

      endpointMonitorData = {
        ...monitor,
        emailChannelIds,
      };

    } catch (error) {
      console.error("Error fetching endpointMonitor with email channels: ", error);
      return NextResponse.json(
        { error: "Failed to fetch endpointMonitor details" },
        { status: INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(endpointMonitorData);
  });

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
    const { env } = getCloudflareContext();
    const db = useDrizzle(env.DB);
    const monitorId = context.params.id;

    // The body type is inferred from endpointMonitorsPatchSchema, which now includes emailChannelIds
    const { emailChannelIds, ...monitorUpdateData } = context.body;

    let updatedMonitor: z.infer<typeof endpointMonitorsSelectSchema> | undefined | null;

    try {
      updatedMonitor = await db.transaction(async (tx) => {
        // 1. Update the EndpointMonitorsTable itself if there's other data to update
        if (Object.keys(monitorUpdateData).length > 0) {
          await tx
            .update(EndpointMonitorsTable)
            .set(monitorUpdateData)
            .where(eq(EndpointMonitorsTable.id, monitorId));
        }

        // 2. Handle emailChannelIds if provided
        if (emailChannelIds !== undefined) {
          // Delete existing associations for this monitor
          // Import EndpointMonitorEmailChannelsTable if not already
          // import { EndpointMonitorEmailChannelsTable } from "@/db/schema";
          await tx
            .delete(EndpointMonitorEmailChannelsTable)
            .where(eq(EndpointMonitorEmailChannelsTable.endpointMonitorId, monitorId));

          // If new emailChannelIds are provided and not empty, insert them
          if (emailChannelIds.length > 0) {
            const newChannelLinks = emailChannelIds.map((channelId) => ({
              endpointMonitorId: monitorId,
              emailChannelId: channelId,
            }));
            await tx.insert(EndpointMonitorEmailChannelsTable).values(newChannelLinks);
          }
        }

        // 3. Fetch the updated monitor to return (or the current state if only channels changed)
        const finalMonitorState = await tx.query.EndpointMonitorsTable.findFirst({
          where: eq(EndpointMonitorsTable.id, monitorId),
        });

        if (!finalMonitorState) {
          // This should ideally not happen if the monitor existed before the transaction
          throw new Error("Monitor not found after update transaction.");
        }
        return finalMonitorState;
      });

    } catch (error) {
      console.error("Error updating endpointMonitor or its email channels: ", error);
      return NextResponse.json(
        { error: "Failed to update endpointMonitor" },
        { status: INTERNAL_SERVER_ERROR }
      );
    }

    if (!updatedMonitor) {
      // This case might be redundant due to the throw inside transaction, but kept for safety
      return NextResponse.json(
        { message: NOT_FOUND_PHRASE },
        { status: NOT_FOUND }
      );
    }
    
    // If checkInterval was part of monitorUpdateData and potentially changed
    if (monitorUpdateData.checkInterval !== undefined && updatedMonitor.checkInterval === monitorUpdateData.checkInterval) {
      console.log(
        `Updating check interval for [${updatedMonitor.id}] to [${updatedMonitor.checkInterval}]`
      );
      await env.MONITOR_TRIGGER_RPC.updateCheckInterval(
        updatedMonitor.id,
        updatedMonitor.checkInterval
      );
    }

    // TODO: The response should ideally include the updated email channel associations.
    // This requires fetching them after the transaction or adjusting the return from transaction.
    return NextResponse.json(updatedMonitor, { status: OK });
  });

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
