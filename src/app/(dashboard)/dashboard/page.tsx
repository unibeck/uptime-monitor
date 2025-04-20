import { getAuth, requireAuth } from "@/lib/auth-utils"
import Dashboard from "./dashboard"

export default async function Page() {
  // Handled in layout
  // const auth = await getAuth()
  // await requireAuth(auth)

  return <Dashboard />
}
