import type { endpointMonitorsSelectSchema } from "@/db/zod-schema"
import type { z } from "zod"

// TODO this method isn't used, is it normal ?

export function getEndpointMonitorSignature(
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>,
): string {
  return `[${endpointMonitor.id}](${endpointMonitor.url})`
}
