import { DurableObject, WorkerEntrypoint } from "cloudflare:workers"
import { takeUniqueOrThrow, useDrizzle } from "@/db"
import { EndpointMonitorsTable } from "@/db/schema"
import {
  MonitorTriggerNotInitializedError,
  getErrorMessage,
} from "@/lib/errors"
import { endpointSignature } from "@/lib/formatters"
import { diffable, state } from "diffable-objects"
import { eq } from "drizzle-orm"
import * as HttpStatusCodes from "stoker/http-status-codes"
import * as HttpStatusPhrases from "stoker/http-status-phrases"

/**
 * The Monitor class is a Durable Object that is used to trigger checks on a endpointMonitor.
 */
export class MonitorTrigger extends DurableObject<CloudflareEnv> {
  @diffable
  #state = {
    endpointMonitorId: null as string | null,
    checkInterval: null as number | null,
  }

  async init(endpointMonitorId: string, checkInterval: number) {
    console.log(`Initializing Monitor Trigger DO for [${endpointMonitorId}]`)

    // Initialize state
    this.#state.endpointMonitorId = endpointMonitorId
    this.#state.checkInterval = checkInterval

    await this.triggerCheck(endpointMonitorId, checkInterval)
  }

  private async getEndpointMonitorId(): Promise<string> {
    const endpointMonitorId = this.#state.endpointMonitorId
    if (!endpointMonitorId) {
      throw new MonitorTriggerNotInitializedError(
        "EndpointMonitor ID is not set. This should never happen. Reinitialize if this DO is expected to exist",
      )
    }

    return endpointMonitorId
  }

  private async getCheckInterval(): Promise<number> {
    const checkInterval = this.#state.checkInterval
    if (!checkInterval) {
      throw new MonitorTriggerNotInitializedError(
        "Check interval is not set. This should never happen. Reinitialize if this DO is expected to exist",
      )
    }

    return checkInterval
  }

  async alarm(alarmInfo: { retryCount: number; isRetry: boolean }) {
    const endpointMonitorId = await this.getEndpointMonitorId()
    const checkInterval = await this.getCheckInterval()

    // Log if this is a retry
    if (alarmInfo.isRetry) {
      console.log(
        `Received an alarm retry #${alarmInfo.retryCount} for [${endpointMonitorId}]. Not retrying`,
      )
      return
    }

    await this.triggerCheck(endpointMonitorId, checkInterval)
  }

  private async triggerCheck(endpointMonitorId: string, checkInterval: number) {
    console.log(`Triggering check for [${endpointMonitorId}]`)

    // Delegate the endpointMonitor check to a Worker, which will return immediately via waitUntil(), to avoid excessive wall time billing
    await this.env.MONITOR_EXEC.executeCheck(endpointMonitorId)

    // Then immediately schedule the next check
    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)
    console.log(`Scheduled next check for [${endpointMonitorId}]`)
  }

  async updateCheckInterval(checkInterval: number) {
    const endpointMonitorId = await this.getEndpointMonitorId()
    console.log(
      `Updating check interval for [${endpointMonitorId}] to [${checkInterval}]`,
    )

    this.#state.checkInterval = checkInterval
    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)

    console.log(
      `Updated check interval for [${endpointMonitorId}] to [${checkInterval}]`,
    )
  }

  async pause() {
    const endpointMonitorId = await this.getEndpointMonitorId()
    console.log(`Pausing MonitorTrigger DO for [${endpointMonitorId}]`)

    await this.ctx.storage.deleteAlarm()

    const db = useDrizzle(this.env.DB)
    const endpointMonitor = await db
      .update(EndpointMonitorsTable)
      .set({ isRunning: false })
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .returning()
      .then(takeUniqueOrThrow)

    console.log(`Paused MonitorTrigger DO for ${endpointSignature(endpointMonitor)}`)
  }

  async resume() {
    const endpointMonitorId = await this.getEndpointMonitorId()
    const checkInterval = await this.getCheckInterval()
    console.log(
      `Resuming MonitorTrigger DO for [${endpointMonitorId}] with check interval [${checkInterval}]`,
    )

    this.ctx.storage.setAlarm(Date.now() + checkInterval * 1000)

    const db = useDrizzle(this.env.DB)
    const endpointMonitor = await db
      .update(EndpointMonitorsTable)
      .set({ isRunning: true })
      .where(eq(EndpointMonitorsTable.id, endpointMonitorId))
      .returning()
      .then(takeUniqueOrThrow)

    console.log(`Resumed MonitorTrigger DO for ${endpointSignature(endpointMonitor)}`)
  }

  async delete() {
    console.log(`Deleting MonitorTrigger DO for [${this.#state.endpointMonitorId}]`)
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
    console.log(`Deleted MonitorTrigger DO for [${this.#state.endpointMonitorId}]`)
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

  async init(endpointMonitorId: string, checkInterval: number) {
    const id = this.env.MONITOR_TRIGGER.idFromName(endpointMonitorId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.init(endpointMonitorId, checkInterval)
  }

  async updateCheckInterval(endpointMonitorId: string, checkInterval: number) {
    const id = this.env.MONITOR_TRIGGER.idFromName(endpointMonitorId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.updateCheckInterval(checkInterval)
  }

  async pauseDo(endpointMonitorId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(endpointMonitorId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.pause()
  }

  async resumeDo(endpointMonitorId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(endpointMonitorId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.resume()
  }

  async deleteDo(endpointMonitorId: string) {
    const id = this.env.MONITOR_TRIGGER.idFromName(endpointMonitorId.toString())
    const stub: DurableObjectStub<MonitorTrigger> =
      this.env.MONITOR_TRIGGER.get(id)
    await stub.delete()
  }
}
