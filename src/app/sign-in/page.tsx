import { LoginForm } from "@/components/login-form"
import { getAuth, getSession } from "@/lib/auth-utils"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await getAuth(env)
  const session = await getSession(auth)

  if (session?.user) {
    console.log("Redirecting from sign-in to dashboard")
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
