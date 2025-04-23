import { UptimeChecksTable, endpointMonitorsTable } from "@/db/schema"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

const { createInsertSchema } = createSchemaFactory({
  // This configuration will only coerce dates. Set `coerce` to `true` to coerce all data types or specify others
  coerce: {
    date: true,
  },
})

const { createSelectSchema } = createSchemaFactory({
  // This configuration will only coerce dates. Set `coerce` to `true` to coerce all data types or specify others
  coerce: {
    date: true,
  },
})

export const endpointMonitorsInsertSchema = createInsertSchema(endpointMonitorsTable, {
  url: (schema) => schema.url(),
  expectedStatusCode: z.number().positive().int().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
})
export const endpointMonitorsInsertDTOSchema = endpointMonitorsInsertSchema.omit({
  id: true,
})
export const endpointMonitorsSelectSchema = createSelectSchema(endpointMonitorsTable)
export const endpointMonitorsPatchSchema = createInsertSchema(endpointMonitorsTable).partial()

export const uptimeChecksInsertSchema = createInsertSchema(
  UptimeChecksTable,
).omit({
  id: true,
})
export const uptimeChecksSelectSchema = createSelectSchema(UptimeChecksTable)
export const uptimeChecksPatchSchema =
  createInsertSchema(UptimeChecksTable).partial()
