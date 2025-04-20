"use client"

import {
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react"

import { authClient } from "@/lib/auth-client"
import type { Session } from "@/lib/auth-types"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york-v4/ui/avatar"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/registry/new-york-v4/ui/sidebar"
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton"
import { redirect, useRouter } from "next/navigation"
import { Suspense, useState } from "react"

export function UserMenu(props: {
  session: Session | null
}) {
  const router = useRouter()
  const { data } = authClient.useSession()
  const session = data || props.session
  const isMobile = useSidebar()
  const [isSignOut, setIsSignOut] = useState<boolean>(false)

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const onDropdownOpenChange = (open: boolean) => {
    console.log("dropdown", open)

    if (!open && isSignOut) {
      console.log("Currently signing out, not closing dropdown")
      return
    }

    setDropdownOpen(open)
  }

  const user = session?.user
  if (!user) {
    return <Skeleton className="w-full h-full" />
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={onDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="rounded-lg">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <IconDotsVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className="rounded-lg">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUserCircle />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconNotification />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem
          onSelect={(e) => {
            console.log("signout selected")
            e.preventDefault()
          }}
        >
          <Button
            variant="ghost"
            onClick={() => {
              console.log("sign out")
              setIsSignOut(true)
              authClient.signOut({
                fetchOptions: {
                  onSuccess() {
                    router.prefetch("/sign-in")
                    router.push("/sign-in")
                    setIsSignOut(false)
                  },
                  // onSuccess: async () => {
                  //   await onSignOutSuccess()
                  // },
                  onError() {
                    console.log("sign out error")
                    setIsSignOut(false)
                  },
                },
              })
            }}
            disabled={isSignOut}
          >
            <IconLogout />
            Log out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
