import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { takeUniqueOrThrow, useDrizzle } from "@/db";
import { EmailNotificationChannelsTable } from "@/db/schema";
import {
  emailNotificationChannelSelectSchema,
  emailNotificationChannelUpdateSchema,
} from "@/db/zod-schema";
import { createRoute } from "@/lib/api-utils";

const paramsSchema = z.object({
  id: z.string(),
});

/**
 * PUT /api/email-notification-channels/[id]
 *
 * Updates an existing email notification channel.
 */
export const PUT = createRoute
  .params(paramsSchema)
  .body(emailNotificationChannelUpdateSchema)
  .handler(async (_request, context) => {
    const { id } = context.params;
    const channelData = context.body;
    const { env } = getCloudflareContext();
    const db = useDrizzle(env.DB);

    // Check if channel exists
    const existingChannel = await db
      .select()
      .from(EmailNotificationChannelsTable)
      .where(eq(EmailNotificationChannelsTable.id, id))
      .limit(1)
      .then((res) => res[0] as z.infer<typeof emailNotificationChannelSelectSchema> | undefined);

    if (!existingChannel) {
      return NextResponse.json(
        { message: `Email notification channel with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    // If email address is being updated, check if the new email already exists for another channel
    if (channelData.emailAddress && channelData.emailAddress !== existingChannel.emailAddress) {
      const conflictingChannel = await db
        .select()
        .from(EmailNotificationChannelsTable)
        .where(eq(EmailNotificationChannelsTable.emailAddress, channelData.emailAddress))
        .limit(1)
        .then((res) => res[0]);

      if (conflictingChannel) {
        return NextResponse.json(
          {
            message: `An email notification channel with the email address "${channelData.emailAddress}" already exists.`,
            conflictingChannel,
          },
          { status: 409 } // Conflict
        );
      }
    }
    
    const updatedChannel = await db
      .update(EmailNotificationChannelsTable)
      .set({ ...channelData, updatedAt: new Date() }) // Manually set updatedAt
      .where(eq(EmailNotificationChannelsTable.id, id))
      .returning()
      .then(takeUniqueOrThrow);

    console.log(`Updated email notification channel with ID "${id}":`, updatedChannel);
    return NextResponse.json(updatedChannel);
  });

/**
 * DELETE /api/email-notification-channels/[id]
 *
 * Deletes an email notification channel.
 */
export const DELETE = createRoute
  .params(paramsSchema)
  .handler(async (_request, context) => {
    const { id } = context.params;
    const { env } = getCloudflareContext();
    const db = useDrizzle(env.DB);

    // Check if channel exists
    const existingChannel = await db
      .select({ id: EmailNotificationChannelsTable.id }) // Select only id for efficiency
      .from(EmailNotificationChannelsTable)
      .where(eq(EmailNotificationChannelsTable.id, id))
      .limit(1)
      .then((res) => res[0]);

    if (!existingChannel) {
      return NextResponse.json(
        { message: `Email notification channel with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    await db
      .delete(EmailNotificationChannelsTable)
      .where(eq(EmailNotificationChannelsTable.id, id));

    console.log(`Deleted email notification channel with ID "${id}"`);
    return new NextResponse(null, { status: 204 }); // No Content
  });
