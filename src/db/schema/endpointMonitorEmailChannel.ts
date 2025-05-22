import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { EndpointMonitorsTable } from "@/db/schema/endpointMonitor";
import { EmailNotificationChannelsTable } from "@/db/schema/emailNotificationChannel";
import { timestamps } from "@/db/schema/utils";

export const EndpointMonitorEmailChannelsTable = sqliteTable(
  "endpointMonitorEmailChannels",
  {
    endpointMonitorId: text("endpointMonitorId")
      .notNull()
      .references(() => EndpointMonitorsTable.id, { onDelete: "cascade" }),
    emailChannelId: text("emailChannelId")
      .notNull()
      .references(() => EmailNotificationChannelsTable.id, {
        onDelete: "cascade",
      }),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.endpointMonitorId, table.emailChannelId],
      }),
    };
  }
);
