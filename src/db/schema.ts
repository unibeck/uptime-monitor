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

export const WebsitesTable = sqliteTable("websites", {
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
  websiteId: text("websiteId")
    .notNull()
    .references(() => WebsitesTable.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  status: integer("status"),
  responseTime: integer("responseTime"),

  // TODO: make this isExpectedStatus since the website expectedStatusCode can be a not healthy value, 
  // and therefore isUp is no longer accurate
  isUp: integer("isUp", { mode: "boolean" }).notNull(),
})
