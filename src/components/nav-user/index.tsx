import { UserMenu } from "@/components/nav-user/user-menu"
import { getAuth, getSession } from "@/lib/auth-server-utils"
import { SidebarMenu, SidebarMenuItem } from "@/registry/new-york-v4/ui/sidebar"
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton"
import { Suspense } from "react"

export async function NavUser() {
  const auth = await getAuth()
  const session = await getSession(auth)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Suspense fallback={<Skeleton className="w-full h-full" />}>
          <UserMenu session={JSON.parse(JSON.stringify(session))} />
        </Suspense>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
