/**
 * Opsgenie API integration for creating alerts
 *
 * Documentation: https://docs.opsgenie.com/docs/alert-api
 */

interface OpsgenieAlertPayload {
  message: string
  description?: string
  alias?: string
  responders?: Array<{
    id?: string
    username?: string
    name?: string
    type: "user" | "team" | "escalation" | "schedule"
  }>
  visibleTo?: Array<{
    id?: string
    username?: string
    name?: string
    type: "user" | "team"
  }>
  actions?: string[]
  tags?: string[]
  details?: Record<string, string>
  entity?: string
  source?: string
  priority?: "P1" | "P2" | "P3" | "P4" | "P5"
  user?: string
  note?: string
}

interface OpsgenieAlertResponse {
  result: string
  took: number
  requestId: string
  message?: string
}

/**
 * Send an alert to Opsgenie
 *
 * @param apiKey - Opsgenie API key
 * @param payload - Alert payload
 * @returns Response from Opsgenie API
 */
export async function sendOpsgenieAlert(
  apiKey: string,
  payload: OpsgenieAlertPayload,
): Promise<OpsgenieAlertResponse | null> {
  try {
    const response = await fetch("https://api.opsgenie.com/v2/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `GenieKey ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Opsgenie API error (${response.status}): ${errorText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending alert to Opsgenie:", error)
    return null
  }
}

/**
 * Create an alert for a failed website check
 *
 * @param apiKey - Opsgenie API key
 * @param websiteName - Name of the website that failed
 * @param websiteUrl - URL of the website that failed
 * @param status - HTTP status code (if any)
 * @param error - Error message (if any)
 * @returns Response from Opsgenie API
 */
export async function createWebsiteDownAlert(
  apiKey: string,
  websiteName: string,
  websiteUrl: string,
  status?: number,
  error?: string,
): Promise<OpsgenieAlertResponse | null> {
  const message = `Website Down: ${websiteName}`

  const description = status
    ? `Website ${websiteName} (${websiteUrl}) is down with status code ${status}.`
    : `Website ${websiteName} (${websiteUrl}) is down. ${error || ""}`

  return sendOpsgenieAlert(apiKey, {
    message,
    description,
    alias: `website-down-${websiteUrl.replace(/[^a-zA-Z0-9]/g, "-")}`,
    priority: "P2",
    tags: ["uptime-monitor", "downtime"],
    entity: websiteUrl,
    source: "Uptime Monitor",
    details: {
      website: websiteName,
      url: websiteUrl,
      status: status?.toString() || "N/A",
      error: error || "",
      monitorRepo:
        "https://github.com/unibeck/uptime-monitor",
      // cloudflareWorkerDashboard:
      //   "https://dash.cloudflare.com/UPDATE_ME_ABC",
      // cloudflareMonitorDODashboard:
      //   "https://dash.cloudflare.com/UPDATE_ME_ABC",
    },
  })
}
