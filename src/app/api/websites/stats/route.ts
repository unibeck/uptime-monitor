import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { takeFirstOrNull } from "@/db"
import { UptimeChecksTable, WebsitesTable } from "@/db/schema"
import { createRoute } from "@/lib/api-utils"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { and, avg, count, desc, eq, gt, isNotNull, max, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { z } from "zod"

// Cache duration in seconds
export const revalidate = 120

/**
 * GET /api/websites/stats
 * 
 * Retrieves aggregate statistics for website monitoring dashboard.
 * 
 * @returns {Promise<NextResponse>} JSON response with aggregate statistics
 * @throws {NextResponse} 500 Internal Server Error on database errors
 */
export const GET = createRoute
  .handler(async (request, context) => {
    const { env } = getCloudflareContext()
    const db = useDrizzle(env.DB)
    
    try {
      // Get total website count
      const { totalWebsites } = await db
        .select({ 
          totalWebsites: count() 
        })
        .from(WebsitesTable)
        .then(takeUniqueOrThrow)
      
      // Get count of websites with active alerts
      const { sitesWithAlerts } = await db
        .select({ 
          sitesWithAlerts: count() 
        })
        .from(WebsitesTable)
        .where(eq(WebsitesTable.activeAlert, true))
        .then(takeUniqueOrThrow)
      
      // Get highest response time and associated website ID in the last 24 hours
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const highestCheck = await db
        .select({
          highestResponseTime: UptimeChecksTable.responseTime,
          highestResponseTimeWebsiteId: UptimeChecksTable.websiteId
        })
        .from(UptimeChecksTable)
        .where(
          and(
            gt(UptimeChecksTable.timestamp, oneDayAgo),
            isNotNull(UptimeChecksTable.responseTime)
          )
        )
        .orderBy(desc(UptimeChecksTable.responseTime))
        .limit(1)
        .then(takeFirstOrNull)
      
      // Get overall uptime percentage in the last 24 hours
      const checksResult = await db
        .select({
          isUp: UptimeChecksTable.isUp
        })
        .from(UptimeChecksTable)
        .where(gt(UptimeChecksTable.timestamp, oneDayAgo))
      
      const totalChecks = checksResult.length
      const successfulChecks = checksResult.filter(check => check.isUp).length
      
      const uptimePercentage = totalChecks > 0 
        ? (successfulChecks / totalChecks) * 100 
        : 100

      return NextResponse.json(
        {
          totalWebsites,
          sitesWithAlerts,
          highestResponseTime: highestCheck?.highestResponseTime ?? 0,
          highestResponseTimeWebsiteId: highestCheck?.highestResponseTimeWebsiteId ?? null,
          uptimePercentage: Math.round(uptimePercentage * 100) / 100
        },
        { 
          status: HttpStatusCodes.OK
        }
      )
    } catch (error) {
      console.error("Error fetching dashboard statistics: ", error)
      return NextResponse.json(
        { error: "Failed to fetch dashboard statistics" },
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR }
      )
    }
  }) 