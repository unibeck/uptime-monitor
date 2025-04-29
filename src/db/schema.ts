import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

const timestamps = {
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date())
    .$onUpdate(() => new Date()),
}

export const EndpointMonitorsTable = sqliteTable("endpointMonitors", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  checkInterval: integer("checkInterval").notNull(),
  isRunning: integer("isRunning", { mode: "boolean" }).notNull().default(true),
  expectedStatusCode: integer("expectedStatusCode"),
  consecutiveFailures: integer("consecutiveFailures").notNull().default(0),
  activeAlert: integer("activeAlert", { mode: "boolean" })
    .notNull()
    .default(false),

  ...timestamps,
})

export const UptimeChecksTable = sqliteTable("uptimeChecks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  endpointMonitorId: text("endpointMonitorId")
    .notNull()
    .references(() => EndpointMonitorsTable.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  status: integer("status"),
  responseTime: integer("responseTime"),
  isExpectedStatus: integer("isExpectedStatus", { mode: "boolean" }).notNull(),
})

// New table for Synthetic Monitors
export const SyntheticMonitorsTable = sqliteTable("syntheticMonitors", {
  id: text("id").primaryKey(), // Will store the script in R2 keyed by this ID
  name: text("name").notNull(),
  checkInterval: integer("checkInterval").notNull(), // In seconds
  timeoutSeconds: integer("timeoutSeconds").notNull(), // In seconds
  runtime: text("runtime", {
    enum: ["playwright-cf-latest", "puppeteer-cf-latest"],
  }).notNull(),
  isRunning: integer("isRunning", { mode: "boolean" }).notNull().default(true),
  consecutiveFailures: integer("consecutiveFailures").notNull().default(0),
  activeAlert: integer("activeAlert", { mode: "boolean" })
    .notNull()
    .default(false),

  ...timestamps,
})

// New table for Synthetic Check results
export const SyntheticChecksTable = sqliteTable("syntheticChecks", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  syntheticMonitorId: text("syntheticMonitorId")
    .notNull()
    .references(() => SyntheticMonitorsTable.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  statusOutcome: text("statusOutcome", {
    enum: ["success", "failure"],
  }).notNull(),
  durationMs: integer("durationMs").notNull(), // Execution time
  errorMessage: text("errorMessage"), // Optional error message on failure
})

export const schema = {
  EndpointMonitorsTable,
  UptimeChecksTable,
  SyntheticMonitorsTable,
  SyntheticChecksTable,
}
