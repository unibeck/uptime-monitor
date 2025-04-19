import { UptimeChecksTable, WebsitesTable } from "@/db/schema"
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

export const websitesInsertSchema = createInsertSchema(WebsitesTable, {
  url: (schema) => schema.url(),
  expectedStatusCode: z.number().positive().int(),
}).omit({
  createdAt: true,
  updatedAt: true,
})
export const websitesInsertDTOSchema = websitesInsertSchema.omit({
  id: true,
})
export const websitesSelectSchema = createSelectSchema(WebsitesTable)
export const websitesPatchSchema = createInsertSchema(WebsitesTable).partial()

export const uptimeChecksInsertSchema = createInsertSchema(
  UptimeChecksTable,
).omit({
  id: true,
})
export const uptimeChecksSelectSchema = createSelectSchema(UptimeChecksTable)
export const uptimeChecksPatchSchema =
  createInsertSchema(UptimeChecksTable).partial()
