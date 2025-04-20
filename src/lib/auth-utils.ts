"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { type Auth, useAuth } from "@/lib/auth"
import type { Session } from "@/lib/auth-types"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const getAuth = async (cfEnv?: CloudflareEnv): Promise<Auth> => {
  if (!cfEnv) {
    const { env } = getCloudflareContext()
    return useAuth(env)
  }
  return useAuth(cfEnv)
}

/**
 * Gets the current user session from the API
 * @param cfEnv The Cloudflare environment
 * @returns An object containing the current user session or null, and the Auth instance
 */
export const getSession = async (auth: Auth): Promise<Session | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    return session
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

/**
 * Checks if the user is authenticated and redirects to login if not
 * @param auth The Auth instance
 * @param redirectTo The path to redirect to after login
 * @returns The current user session
 */
export async function requireAuth(
  auth: Auth,
  redirectTo = "/sign-in",
): Promise<Session> {
  const session = await getSession(auth)

  if (!session || !session.user || !session.session) {
    console.log("Redirecting to sign in")
    redirect(redirectTo)
  }

  return session
}

export async function onSignOutSuccess() {
  console.log("sign out success and redirecting to sign-in")
  redirect("/sign-in")
}
