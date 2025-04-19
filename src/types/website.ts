import type { websitesSelectSchema } from "@/db/zod-schema"
import type { z } from "zod"

export type TimeRange = "1h" | "1d" | "7d"

export interface ConflictWebsiteResponse {
  message: string
  matchingWebsite: z.infer<typeof websitesSelectSchema>
}
