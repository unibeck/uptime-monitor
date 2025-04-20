import { useDrizzle } from "@/db"
import { getAppEnvMetadata } from "@/lib/app-env"
import { getAppEnvID } from "@/lib/app-env"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { genericOAuth, openAPI } from "better-auth/plugins"

export type Auth = ReturnType<typeof betterAuth>

let authInstance: Auth

export function useAuth(cfEnv: CloudflareEnv): Auth {
  if (!authInstance) {
    const db = useDrizzle(cfEnv.DB)
    const appEnvMetadata = getAppEnvMetadata(getAppEnvID(cfEnv))

    authInstance = betterAuth({
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        cookieCache: {
          enabled: true,
          maxAge: 10 * 60, // 10 minutes
        },
      },
      secret: cfEnv.BETTER_AUTH_SECRET,
      baseURL: appEnvMetadata.appUrl,
      emailAndPassword: {
        enabled: false,
      },
      trustedOrigins: [appEnvMetadata.appUrl],
      // secondaryStorage: {
      //   get: (k) => env.AuthKV.get(k),
      //   set: (k, v) => env.AuthKV.put(k, v),
      //   delete: (k) => env.AuthKV.delete(k),
      // },
      plugins: [
        openAPI(),
        genericOAuth({
          config: [
            {
              providerId: "okta",
              clientId: cfEnv.OKTA_CLIENT_ID,
              clientSecret: cfEnv.OKTA_CLIENT_SECRET,
              discoveryUrl: cfEnv.OKTA_DISCOVERY_URL,

              scopes: ["openid", "email", "profile"],

              // https://github.com/better-auth/better-auth/issues/1210
              pkce: false,

              // https://github.com/better-auth/better-auth/issues/2003
              // getUserInfo: false,
            },
          ],
        }),
        nextCookies(), // make sure this is the last plugin in the array
      ],
      database: drizzleAdapter(db, {
        provider: "sqlite",
        usePlural: true,
      }),
    })
  }

  return authInstance
}
