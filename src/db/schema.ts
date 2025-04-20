import * as authSchema from "./schema-auth.sql"
import * as monitorSchema from "./schema-monitor.sql"

export * from "./schema-auth.sql"
export * from "./schema-monitor.sql"

export const schema = {
  ...authSchema,
  ...monitorSchema,
}

export type DrizzleSchema = typeof schema
