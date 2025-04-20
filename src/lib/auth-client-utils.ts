import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { authClient } from "./auth-client"

/**
 * Gets the current user session from the API
 * @returns The current user session or null if not authenticated
 */
export const getCurrentSession = cache(async () => {
  try {
    const response = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    })
    return response.data
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
})

/**
 * Checks if the user is authenticated and redirects to login if not
 * @param redirectTo The path to redirect to after login
 */
export async function requireAuth(redirectTo = "/login") {
  const currentSession = await getCurrentSession()

  if (!currentSession || !currentSession.user || !currentSession.session) {
    redirect(redirectTo)
  }

  return currentSession
}
