import type { endpointMonitorsSelectSchema } from "@/db/zod-schema"
import type { z } from "zod"

export type TimeRange = "1h" | "1d" | "7d"

export interface ConflictEndpointMonitorResponse {
  message: string
  matchingEndpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>
}
