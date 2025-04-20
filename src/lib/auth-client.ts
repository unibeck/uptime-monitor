import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts"
import { genericOAuthClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { toast } from "sonner"
import { TOO_MANY_REQUESTS } from "stoker/http-status-codes"

export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
  // fetchOptions: {
  //   onError: async (context) => {
  //     const { response, error } = context
  //     if (response.status === TOO_MANY_REQUESTS) {
  //       const retryAfter = response.headers.get("X-Retry-After")
  //       console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`)
  //       console.error(error)

  //       toast.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`, {
  //         description: error.message,
  //         ...DEFAULT_TOAST_OPTIONS,
  //       })
  //     }
  //   },
  // },
})

// TODO: remove this to force the prefix authClient.*. This will make it explicit when using client functions on the client side
export const { signIn, signOut, useSession } = authClient
