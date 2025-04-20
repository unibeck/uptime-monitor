import { getAuth, getSession } from "@/lib/auth-utils"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from "next/navigation"

export default async function Home() {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await getAuth(env)
  const session = await getSession(auth)

  if (!session || !session.user || !session.session) {
    console.log("Redirecting from root to sign in")
    redirect("/sign-in")
  }

  console.log("Redirecting from root to dashboard")
  redirect("/dashboard")
}
