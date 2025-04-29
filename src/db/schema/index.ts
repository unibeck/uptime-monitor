import { EndpointMonitorsTable, UptimeChecksTable } from "./endpointMonitor"
import { SyntheticMonitorsTable, SyntheticChecksTable } from "./syntheticMonitor"

export * from "./endpointMonitor"
export * from "./syntheticMonitor"

export const schema = {
    EndpointMonitorsTable,
    UptimeChecksTable,
    SyntheticMonitorsTable,
    SyntheticChecksTable,
}
