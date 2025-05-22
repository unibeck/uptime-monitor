import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "@/db/schema/utils";
import { createId, PRE_ID } from "@/lib/ids";

export const EmailNotificationChannelsTable = sqliteTable(
  "emailNotificationChannels",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId(PRE_ID.emailNotificationChannel)),
    name: text("name").notNull(),
    emailAddress: text("emailAddress").notNull(),
    ...timestamps,
  }
);
