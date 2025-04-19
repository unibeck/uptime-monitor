import { DurableObject, WorkerEntrypoint } from "cloudflare:workers"
import { takeFirstOrNull, useDrizzle } from "@/db"
import { WebsitesTable } from "@/db/schema"
import type { websitesSelectSchema } from "@/db/zod-schema"
import { state } from "diffable-objects"
import { eq } from "drizzle-orm"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"
import type { z } from "zod"
import { getWebsiteSignature } from "./utils"

/**
 * The Monitor class is a Durable Object that is used to trigger checks on a website.
 */
export class MonitorTrigger extends DurableObject<CloudflareEnv> {
  #state = state(this.ctx, "state", {
    websiteId: null as string | null,
    checkInterval: null as number | null,
  })

  async init(websiteId: string, checkInterval: number) {
    console.log(`Initializing Monitor Trigger DO for [${websiteId}]`)

    // Initialize state
    this.#state.websiteId = websiteId
    this.#state.checkInterval = checkInterval

    await this.triggerCheck(websiteId, checkInterval)
  }

  private async getWebsiteId(): Promise<string> {
    const websiteId = this.#state.websiteId
    if (!websiteId) {
      await this.delete()
      throw new Error(
        "Website ID is not set. This should never happen. Deleted MonitorTrigger DO",
      )
    }

    return websiteId
  }

  private async getCheckInterval(): Promise<number> {
    const checkInterval = this.#state.checkInterval
    if (!checkInterval) {
      await this.delete()
      throw new Error(
        "Check interval is not set. This should never happen. Deleted MonitorTrigger DO",
      )
    }

    return checkInterval
  }

  async alarm(alarmInfo: { retryCount: number; isRetry: boolean }) {
    const websiteId = await this.getWebsiteId()
    const checkInterval = await this.getCheckInterval()

    // Log if this is a retry
    if (alarmInfo.isRetry) {
      console.log(
        `Received an alarm retry #${alarmInfo.retryCount} for [${websiteId}]. Not retrying`,
      )
      return
    }

    await this.triggerCheck(websiteId, checkInterval)
  }

  private async triggerCheck(websiteId: string, checkInterval: number) {
    console.log(`Triggering check for [${websiteId}]`)

    // Delegate the website check to a Worker, which will return immediately via waitUntil(), to avoid excessive wall time billing
    await this.env.MONITOR_EXEC.executeCheck(websiteId)

    // Then immediately schedule the next check
    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)
    console.log(`Scheduled next check for [${websiteId}]`)
  }

  async updateCheckInterval(checkInterval: number) {
    const websiteId = await this.getWebsiteId()
    console.log(
      `Updating check interval for [${websiteId}] to [${checkInterval}]`,
    )

    this.#state.checkInterval = checkInterval
    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)

    console.log(
      `Updated check interval for [${websiteId}] to [${checkInterval}]`,
    )
  }

  async pause() {
    const websiteId = await this.getWebsiteId()
    console.log(`Pausing MonitorTrigger DO for [${websiteId}]`)

    await this.ctx.storage.deleteAlarm()

    const db = useDrizzle(this.env.DB)
    await db
      .update(WebsitesTable)
      .set({ isRunning: false })
      .where(eq(WebsitesTable.id, websiteId))

    console.log(`Paused MonitorTrigger DO for [${websiteId}]`)
  }

  async resume() {
    const websiteId = await this.getWebsiteId()
    const checkInterval = await this.getCheckInterval()
    console.log(
      `Resuming MonitorTrigger DO for [${websiteId}] with check interval [${checkInterval}]`,
    )

    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)

    const db = useDrizzle(this.env.DB)
    await db
      .update(WebsitesTable)
      .set({ isRunning: true })
      .where(eq(WebsitesTable.id, websiteId))

    console.log(`Resumed MonitorTrigger DO for [${websiteId}]`)
  }

  async delete() {
    console.log(`Deleting MonitorTrigger DO for [${this.#state.websiteId}]`)
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
    console.log(`Deleted MonitorTrigger DO for [${this.#state.websiteId}]`)
  }
}

// Need service as RPC bindings do not work locally
export default class MonitorTriggerRPC extends WorkerEntrypoint<CloudflareEnv> {
  async fetch(request: Request) {
    //Use service or RPC binding to work with the Monitor Durable Object
    return new Response(
      `${HttpStatusPhrases.OK}\nMonitorTriggerRPC: Use service or RPC binding to work with the Monitor Durable Object`,
      { status: HttpStatusCodes.OK },
    )
  }

  //////////////////////////////////////////////////////////////////////
  // Monitor DO RPC methods
  //////////////////////////////////////////////////////////////////////

  async init(websiteId: string, checkInterval: number) {
    const id = this.env.MONITOR_TRIGGER.idFromName(websiteId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.init(websiteId, checkInterval)
  }

  async updateCheckInterval(websiteId: string, checkInterval: number) {
    const id = this.env.MONITOR_TRIGGER.idFromName(websiteId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.updateCheckInterval(checkInterval)
  }

  async pauseDo(websiteId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(websiteId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.pause()
  }

  async resumeDo(websiteId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(websiteId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.resume()
  }

  async deleteDo(websiteId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(websiteId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.delete()
  }
}
