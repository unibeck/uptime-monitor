import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"
import { EndpointMonitorsTable, UptimeChecksTable } from "@/db/schema"

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

export const endpointMonitorsInsertSchema = createInsertSchema(
  EndpointMonitorsTable,
  {
    url: (schema) => schema.url(),
    expectedStatusCode: z.number().positive().int().optional(),
    alertThreshold: z.number().positive().int(),
  },
).omit({
  createdAt: true,
  updatedAt: true,
})

export const endpointMonitorsInsertDTOSchema =
  endpointMonitorsInsertSchema.omit({
    id: true,
  })

export const endpointMonitorsSelectSchema = createSelectSchema(
  EndpointMonitorsTable,
)

export const endpointMonitorsPatchSchema = createInsertSchema(
  EndpointMonitorsTable,
).partial()

export const uptimeChecksInsertSchema = createInsertSchema(
  UptimeChecksTable,
).omit({
  id: true,
})

export const uptimeChecksSelectSchema = createSelectSchema(UptimeChecksTable)

export const uptimeChecksPatchSchema =
  createInsertSchema(UptimeChecksTable).partial()
