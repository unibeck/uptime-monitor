import { WorkerEntrypoint } from "cloudflare:workers"
import { and, eq } from "drizzle-orm"; // Ensure 'and' is imported if used, 'eq' is definitely used.
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { OK } from "stoker/http-status-codes";
import { OK as OK_PHRASE } from "stoker/http-status-phrases";
import type { z } from "zod";
import { takeFirstOrNull, useDrizzle } from "@/db";
import type { schema } from "@/db/schema";
import {
  EmailNotificationChannelsTable, // Added
  EndpointMonitorEmailChannelsTable, // Added
  EndpointMonitorsTable,
  UptimeChecksTable,
} from "@/db/schema";
import type {
  endpointMonitorsPatchSchema,
  endpointMonitorsSelectSchema,
} from "@/db/zod-schema";
import { endpointSignature } from "@/lib/formatters";
import { PRE_ID } from "@/lib/ids";
import { createEndpointMonitorDownAlert } from "@/lib/opsgenie";
import { sendNotificationEmail } from "./email-sender"; // Added
} from "@/db/zod-schema"
import { endpointSignature } from "@/lib/formatters"
import { PRE_ID } from "@/lib/ids"
import { createEndpointMonitorDownAlert } from "@/lib/opsgenie"

export default class MonitorExec extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(_request: Request) {
    //Use service or RPC binding to work with the Monitor Durable Object
    return new Response(
      `${OK_PHRASE}\nMonitorExec: Use service or RPC binding to work with the Monitor Durable Object`,
      { status: OK },
    )
  }

  //waitUntil is used to avoid immediately return a response so that the durable object is not charged for wall time
  async executeCheck(endpointMonitorId: string) {
    this.ctx.waitUntil(this._executeCheck(endpointMonitorId))
  }

  private async _executeCheck(endpointMonitorId: string) {
    const db = useDrizzle(this.env.DB)
    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .then(takeFirstOrNull)

    if (!endpointMonitor) {
      console.error(
        `EndpointMonitor [${endpointMonitorId}] does not exist. Deleting Durable Object...`,
      )
      await this.env.MONITOR_TRIGGER_RPC.deleteDo(endpointMonitorId)

      // TODO: Remove this migration logic after some time/versions have passed
      if (endpointMonitorId.includes("webs_")) {
        console.log(
          `[${endpointMonitorId}] is an obsolete website monitor id and needs to be updated . Will attempt to migrate to a new DO...`,
        )

        const newEndpointMonitorId = endpointMonitorId.replace(
          "webs_",
          PRE_ID.endpointMonitor,
        )
        const newEndpointMonitor = await db
          .select()
          .from(EndpointMonitorsTable)
          .where(eq(EndpointMonitorsTable.id, newEndpointMonitorId))
          .then(takeFirstOrNull)

        if (!newEndpointMonitor) {
          console.error(
            `EndpointMonitor [${newEndpointMonitorId}] does not exist. Migration failed.`,
          )
          return
        }

        console.log(
          `Found updated EndpointMonitor ${endpointSignature(newEndpointMonitor)} for obsolete [${endpointMonitorId}]. Initializing new DO...`,
        )
        await this.env.MONITOR_TRIGGER_RPC.init({
          monitorId: newEndpointMonitor.id,
          monitorType: "endpoint",
          checkInterval: newEndpointMonitor.checkInterval,
        })

        console.log(
          `Successfully migrated [${endpointMonitorId}] to [${newEndpointMonitor.id}]`,
        )
      }
      return
    }

    console.log(`${endpointSignature(endpointMonitor)}: performing check...`)
    let isExpectedStatus = false
    let responseTime = 0
    let status = 0
    let errorMessage = ""
    const startTime = Date.now()

    try {
      const response = await fetch(endpointMonitor.url, {
        method: "GET",
        redirect: "follow",
        cf: {
          cacheTTL: 0,
          cacheEverything: false,
        },
      })

      responseTime = Date.now() - startTime
      status = response.status
      // Use expectedStatusCode if provided, otherwise default to 2xx/3xx
      isExpectedStatus =
        endpointMonitor.expectedStatusCode != null
          ? response.status === endpointMonitor.expectedStatusCode
          : response.status >= 200 && response.status < 400
      console.log(
        `${endpointSignature(endpointMonitor)}: check complete. Status: ${status}, Response Time: ${responseTime}ms, ExpectedStatus: ${isExpectedStatus}`,
      )
    } catch (error) {
      responseTime = Date.now() - startTime
      isExpectedStatus = false
      errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Error performing check:", errorMessage)
    }

    // Store check result
    try {
      await db.insert(UptimeChecksTable).values({
        endpointMonitorId: endpointMonitor.id,
        timestamp: new Date(),
        status,
        responseTime,
        isExpectedStatus,
      })
    } catch (error) {
      console.error("Error storing check result: ", error)
    }

    await handleFailureTracking(
      isExpectedStatus,
      status,
      errorMessage,
      endpointMonitor,
      db,
      this.env, // Pass the full env object
    );
  }

  async testSendAlert(
    endpointMonitorId: string,
    status: number,
    errorMessage: string,
  ) {
    console.log(this.env.APP_ENV)
    const db = useDrizzle(this.env.DB)

    const endpointMonitor = await db
      .select()
      .from(EndpointMonitorsTable)
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .then(takeFirstOrNull)
    if (!endpointMonitor) {
      throw new Error(`EndpointMonitor [${endpointMonitorId}] does not exist`)
    }

    await sendAlert(
      status,
      errorMessage,
      endpointMonitor,
      this.env, // Pass the full env object
    );
  }
}

async function handleFailureTracking(
  isExpectedStatus: boolean,
  status: number,
  errorMessage: string,
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>,
  db: DrizzleD1Database<typeof schema>,
  env: CloudflareEnv, // Changed opsgenieApiKey to full env
) {
  if (isExpectedStatus) {
    // Reset consecutive failures if the check passes
    if (endpointMonitor.consecutiveFailures > 0) {
      await db
        .update(EndpointMonitorsTable)
        .set({ consecutiveFailures: 0 })
        .where(eq(EndpointMonitorsTable.id, endpointMonitor.id))
    }
  } else {
    const consecutiveFailures = endpointMonitor.consecutiveFailures + 1
    console.log(
      `${endpointSignature(endpointMonitor)} has ${consecutiveFailures} consecutive failures`,
    )

    const endpointMonitorPatch: z.infer<typeof endpointMonitorsPatchSchema> = {
      consecutiveFailures: consecutiveFailures,
    }

    // Send alert if this is the second consecutive failure and no alert has been sent yet
    if (
      consecutiveFailures >= endpointMonitor.alertThreshold &&
      !endpointMonitor.activeAlert
    ) {
      await sendAlert(status, errorMessage, endpointMonitor, env); // Pass full env
      endpointMonitorPatch.activeAlert = true;
    }

    await db
      .update(EndpointMonitorsTable)
      .set(endpointMonitorPatch)
      .where(eq(EndpointMonitorsTable.id, endpointMonitor.id))
  }
}

async function sendAlert(
  status: number,
  errorMessage: string,
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>,
  env: CloudflareEnv, // Use the full env for OpsGenie key and Email binding
) {
  const opsgenieApiKey = env.OPSGENIE_API_KEY;
  const db = useDrizzle(env.DB); // Get DB instance from env

  console.log(
    `${endpointSignature(endpointMonitor)}: consecutive failures threshold (${
      endpointMonitor.alertThreshold
    }) reached, sending alert(s)...`
  );

  // 1. OpsGenie Alert (existing logic)
  if (opsgenieApiKey) {
    try {
      const result = await createEndpointMonitorDownAlert(
        opsgenieApiKey,
        endpointMonitor.name,
        endpointMonitor.url,
        status,
        errorMessage
      );
      if (result) {
        console.log(
          `${endpointSignature(
            endpointMonitor
          )}: OpsGenie alert sent successfully. RequestId: ${result.requestId}`
        );
      } else {
        console.error(
          `${endpointSignature(endpointMonitor)}: Failed to send OpsGenie alert.`
        );
      }
    } catch (error) {
      console.error(
        `${endpointSignature(endpointMonitor)}: Error sending OpsGenie alert.`,
        error
      );
    }
  } else {
    console.warn("OPSGENIE_API_KEY is not set. Skipping OpsGenie alert.");
  }

  // 2. Email Notifications
  try {
    const channelsToNotify = await db
      .select({
        emailAddress: EmailNotificationChannelsTable.emailAddress,
        channelName: EmailNotificationChannelsTable.name,
      })
      .from(EndpointMonitorEmailChannelsTable)
      .innerJoin(
        EmailNotificationChannelsTable,
        eq(
          EndpointMonitorEmailChannelsTable.emailChannelId,
          EmailNotificationChannelsTable.id
        )
      )
      .where(
        eq(
          EndpointMonitorEmailChannelsTable.endpointMonitorId,
          endpointMonitor.id
        )
      );

    if (channelsToNotify.length === 0) {
      console.log(
        `${endpointSignature(
          endpointMonitor
        )}: No email channels configured for this monitor.`
      );
      return; // Return early if no email channels
    }

    const subject = `SolStatus Alert: ${endpointMonitor.name} is DOWN`;
    const commonDetails = `
Monitor Name: ${endpointMonitor.name}
URL: ${endpointMonitor.url}
Time of Failure: ${new Date().toISOString()}
Status Code: ${status || "N/A"}
Error: ${errorMessage || "No specific error message"}`;

    const htmlBody = `
<h1>SolStatus Alert: ${endpointMonitor.name} is DOWN</h1>
<p><strong>Monitor Name:</strong> ${endpointMonitor.name}</p>
<p><strong>URL:</strong> <a href="${endpointMonitor.url}">${
      endpointMonitor.url
    }</a></p>
<p><strong>Time of Failure:</strong> ${new Date().toISOString()}</p>
<p><strong>Status Code:</strong> ${status || "N/A"}</p>
<p><strong>Error:</strong> ${errorMessage || "No specific error message"}</p>
<p>Please check your SolStatus dashboard for more details.</p>
    `;
    const textBody = `
SolStatus Alert: ${endpointMonitor.name} is DOWN
${commonDetails}
Please check your SolStatus dashboard for more details.
    `;

    for (const channel of channelsToNotify) {
      console.log(
        `${endpointSignature(endpointMonitor)}: Sending email notification to ${
          channel.emailAddress
        } (Channel: ${channel.channelName})`
      );
      // Ensure env object passed to sendNotificationEmail has the EMAIL_SEND_BINDING
      // The CloudflareEnv type should include this if wrangler.jsonc is set up correctly.
      await sendNotificationEmail({
        to: channel.emailAddress,
        subject,
        htmlBody,
        textBody,
        env: env as any, // Cast if EmailEnv in email-sender.ts is more specific than full CloudflareEnv
      });
    }
  } catch (error) {
    console.error(
      `${endpointSignature(
        endpointMonitor
      )}: Error fetching or sending email notifications.`,
      error
    );
  }
}
