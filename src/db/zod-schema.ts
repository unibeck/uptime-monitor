import {
  EndpointMonitorsTable,
  SyntheticChecksTable,
  SyntheticMonitorsTable,
  UptimeChecksTable,
} from "@/db/schema"
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

export const endpointMonitorsInsertSchema = createInsertSchema(
  EndpointMonitorsTable,
  {
    url: (schema) => schema.url(),
    expectedStatusCode: z.number().positive().int().optional(),
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

///////////////////////////////////////////////////////////////////////////////
// Synthetic Monitors Schemas
///////////////////////////////////////////////////////////////////////////////

export const syntheticMonitorsInsertSchema = createInsertSchema(
  SyntheticMonitorsTable,
  {
    checkInterval: z.number().positive().int().min(30), // Minimum interval, e.g., 30 seconds
    timeoutSeconds: z.number().positive().int(),
    runtime: z.enum(["playwright-cf-latest", "puppeteer-cf-latest"]),
  },
).omit({
  createdAt: true,
  updatedAt: true,
  isRunning: true,
  consecutiveFailures: true,
  activeAlert: true,
})

// Schema for API Data Transfer Object (includes non-DB fields like scriptContent)
export const syntheticMonitorsInsertDTOSchema = syntheticMonitorsInsertSchema
  .omit({
    id: true,
  })
  .extend({
    type: z.literal("synthetic"), // Add type literal here for the DTO/Form
    scriptContent: z
      .string()
      .min(1, { message: "Script content cannot be empty" }), // Script content is required
  })
  // Refine to ensure checkInterval is >= timeoutSeconds + 5
  .refine(
    (data) => {
      // Ensure checkInterval is at least 5 seconds greater than timeoutSeconds
      return data.checkInterval >= data.timeoutSeconds + 5
    },
    {
      message:
        "Check Interval must be at least 5 seconds longer than the Timeout",
      path: ["checkInterval", "timeoutSeconds"], // Specify related fields
    },
  )

export const syntheticMonitorsSelectSchema = createSelectSchema(
  SyntheticMonitorsTable,
)
export const syntheticMonitorsPatchSchema = createInsertSchema(
  SyntheticMonitorsTable,
).partial()

///////////////////////////////////////////////////////////////////////////////
// Synthetic Checks Schemas
///////////////////////////////////////////////////////////////////////////////

export const syntheticChecksInsertSchema = createInsertSchema(
  SyntheticChecksTable,
  {
    statusOutcome: z.enum(["success", "failure"]),
    durationMs: z.number().int().nonnegative(),
    errorMessage: z.string().optional(),
  },
).omit({
  id: true,
})

export const syntheticChecksSelectSchema =
  createSelectSchema(SyntheticChecksTable)
export const syntheticChecksPatchSchema =
  createInsertSchema(SyntheticChecksTable).partial()
