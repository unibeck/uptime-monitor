import { EndpointMonitorsTable, UptimeChecksTable } from "./endpointMonitor"
import {
  SyntheticChecksTable,
  SyntheticMonitorsTable,
} from "./syntheticMonitor"

export * from "./endpointMonitor"
export * from "./syntheticMonitor"

export const schema = {
  EndpointMonitorsTable,
  UptimeChecksTable,
  SyntheticMonitorsTable,
  SyntheticChecksTable,
}
