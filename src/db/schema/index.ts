import { EndpointMonitorsTable, UptimeChecksTable } from "./endpointMonitor"
import { EmailNotificationChannelsTable } from "./emailNotificationChannel"
import { EndpointMonitorEmailChannelsTable } from "./endpointMonitorEmailChannel"

export * from "./endpointMonitor"
export * from "./emailNotificationChannel"
export * from "./endpointMonitorEmailChannel"

export const schema = {
  EndpointMonitorsTable,
  UptimeChecksTable,
  EmailNotificationChannelsTable,
  EndpointMonitorEmailChannelsTable,
}
