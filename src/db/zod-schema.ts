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
    emailChannelIds: z.array(z.string()).optional(), // Added emailChannelIds
  },
).omit({
  createdAt: true,
  updatedAt: true,
})

export const endpointMonitorsInsertDTOSchema =
  endpointMonitorsInsertSchema.omit({
    id: true,
  })
// It's good practice to also define it for patch if it can be updated separately,
// but for now, endpointMonitorsInsertDTOSchema is used in the dialog for both create/update.
// If a separate patch schema is used for PATCH /api/endpoint-monitors/[id], update that too.

export const endpointMonitorsSelectSchema = createSelectSchema(
  EndpointMonitorsTable,
)

export const endpointMonitorsPatchSchema = createInsertSchema(
  EndpointMonitorsTable,
  {
    // Ensure all fields that can be patched are included here
    // If they have specific validation for patch (e.g. optional on top of base)
    // For now, we mostly care about adding emailChannelIds
    emailChannelIds: z.array(z.string()).optional(),
  },
).partial(); // .partial() makes all fields optional, suitable for PATCH

export const uptimeChecksInsertSchema = createInsertSchema(
  UptimeChecksTable,
).omit({
  id: true,
})

export const uptimeChecksSelectSchema = createSelectSchema(UptimeChecksTable)

export const uptimeChecksPatchSchema =
  createInsertSchema(UptimeChecksTable).partial()

export * from "./zod-schema/emailNotificationChannel"
