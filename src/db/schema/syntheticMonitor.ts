// import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
// import { timestamps } from "./utils"

// export const SyntheticMonitorsTable = sqliteTable("syntheticMonitors", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   checkInterval: integer("checkInterval").notNull(), // In seconds
//   timeoutSeconds: integer("timeoutSeconds").notNull(), // In seconds
//   runtime: text("runtime", {
//     enum: ["playwright-cf-latest", "puppeteer-cf-latest"],
//   }).notNull(),
//   isRunning: integer("isRunning", { mode: "boolean" }).notNull().default(true),
//   consecutiveFailures: integer("consecutiveFailures").notNull().default(0),
//   activeAlert: integer("activeAlert", { mode: "boolean" })
//     .notNull()
//     .default(false),

//   ...timestamps,
// })

// export const SyntheticChecksTable = sqliteTable("syntheticChecks", {
//   id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
//   syntheticMonitorId: text("syntheticMonitorId")
//     .notNull()
//     .references(() => SyntheticMonitorsTable.id, { onDelete: "cascade" }),
//   timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
//   statusOutcome: text("statusOutcome", {
//     enum: ["success", "failure"],
//   }).notNull(),
//   durationMs: integer("durationMs").notNull(), // Execution time
//   errorMessage: text("errorMessage"), // Optional error message on failure
// })
