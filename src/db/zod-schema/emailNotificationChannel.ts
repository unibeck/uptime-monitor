import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { EmailNotificationChannelsTable } from "@/db/schema";

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  coerce: {
    date: true,
  },
});

export const emailNotificationChannelInsertSchema = createInsertSchema(
  EmailNotificationChannelsTable,
  {
    name: (schema) => schema.name.min(1, "Name is required"),
    emailAddress: (schema) =>
      schema.emailAddress.email("Invalid email address"),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const emailNotificationChannelSelectSchema = createSelectSchema(
  EmailNotificationChannelsTable
);

export const emailNotificationChannelUpdateSchema = createInsertSchema(
  EmailNotificationChannelsTable,
  {
    name: (schema) => schema.name.min(1, "Name is required").optional(),
    emailAddress: (schema) =>
      schema.emailAddress.email("Invalid email address").optional(),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
