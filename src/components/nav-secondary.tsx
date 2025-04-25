"use client"

import {
  type Icon,
  IconBrightness,
  IconCirclePlusFilled,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import React from "react"

import { AddEndpointMonitorDialog } from "@/components/add-endpoint-monitor-dialog"
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
    icon: Icon
    url?: string
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
          <AddEndpointMonitorDialog
            trigger={
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  variant="primary"
                  tooltip="Create a new endpoint monitor to track its uptime and get notified when it's down."
                >
                  <IconCirclePlusFilled />
                  <span>Add Endpoint Monitor</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            }
          />
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.url ? (
                <SidebarMenuButton asChild>
                  <a
                    href={item.url}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild disabled>
                  <div>
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                </SidebarMenuButton>
              )}
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
