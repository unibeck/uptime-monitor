import type { websitesSelectSchema } from "@/db/zod-schema"
import type { z } from "zod"

export function getWebsiteSignature(
  website: z.infer<typeof websitesSelectSchema>,
): string {
  return `[${website.id}](${website.url})`
}
