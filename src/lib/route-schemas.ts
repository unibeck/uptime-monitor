import { z } from "zod"

/**
 * General params schemas
 */
export const idNumParamsSchema = z.object({
  id: z.number(),
})

export const idStringParamsSchema = z.object({
  id: z.string(),
})

export const paginationQuerySchema = (
  orderBy = "createdAt",
  order: "asc" | "desc" = "desc",
) =>
  z.object({
    pageSize: z.number({ coerce: true }).optional().default(10),
    page: z.number({ coerce: true }).optional().default(0),
    orderBy: z.string().optional().default(orderBy),
    order: z.enum(["asc", "desc"]).optional().default(order),
  })

/**
 * Specific query schemas
 */
export const daysQuerySchema = (defaultDays = 1) =>
  z.object({
    days: z.number({ coerce: true }).optional().default(defaultDays),
  })

export const timeRangeQuerySchema = z.object({
  timeRange: z.enum(["1h", "1d", "7d"]).optional().default("1d"),
})
