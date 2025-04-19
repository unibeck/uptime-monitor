"use client"

import { type Icon, IconBrightness, IconCirclePlusFilled } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import * as React from "react"

import { AddWebsiteDialog } from "@/components/add-website-dialog"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/registry/new-york-v4/ui/sidebar"
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton"
import { Switch } from "@/registry/new-york-v4/ui/switch"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    external?: boolean
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="my-4">
          <AddWebsiteDialog trigger={
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                variant="primary"
                tooltip="Create a new website monitor to track its uptime and get notified when it's down."
              >
                <IconCirclePlusFilled />
                <span>Add Website Monitor</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          } />
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a
                  href={item.url}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton asChild>
              <label htmlFor="dark-mode-switch">
                <IconBrightness />
                <span>Dark Mode</span>
                {mounted ? (
                  <Switch
                    id="dark-mode-switch"
                    className="ml-auto"
                    checked={resolvedTheme !== "light"}
                    onCheckedChange={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  />
                ) : (
                  <Skeleton className="ml-auto h-4 w-8 rounded-full" />
                )}
              </label>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
