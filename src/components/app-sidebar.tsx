"use client"

import {
  IconAppWindow,
  IconBell,
  IconBrandGithub,
  IconBulb,
  IconDashboard,
  IconDatabase,
  IconDna,
  IconFileWord,
  IconHeartbeat,
  IconMail,
  IconPrismLight,
  IconReport,
  IconSparkles,
  IconTargetArrow,
} from "@tabler/icons-react"
import type * as React from "react"
import SolStatusLogo from "@/components/icons/solstatus-logo"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { fontUnboundedCN } from "@/lib/fonts"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/registry/new-york-v4/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Monitors",
      url: "/",
      icon: IconDashboard,
      items: [
        {
          title: "Endpoint",
          url: "/",
          icon: IconTargetArrow,
        },
        {
          title: "Synthetic (blocked)",
          url: "https://github.com/unibeck/solstatus/issues/19#issuecomment-2878393426",
          external: true,
          icon: IconAppWindow,
        },
        {
          title: "Agentic (soon)",
          url: "https://github.com/unibeck/solstatus/issues/39",
          external: true,
          icon: IconSparkles,
        },
        {
          title: "Heartbeat (soon)",
          url: "https://github.com/unibeck/solstatus/issues/43",
          external: true,
          icon: IconHeartbeat,
        },
        {
          title: "TCP (soon)",
          url: "https://github.com/unibeck/solstatus/issues/44",
          external: true,
          icon: IconPrismLight,
        },
        {
          title: "Other? Let me know!",
          url: "https://github.com/unibeck/solstatus/issues",
          external: true,
          icon: IconBulb,
        },
      ],
    },

    {
      title: "Notifications",
      url: "/",
      icon: IconBell,
      items: [
        {
          title: "Opsgenie",
          url: "/",
          icon: IconBell,
        },
        {
          title: "Email (soon)",
          url: "https://github.com/unibeck/solstatus/issues/47",
          external: true,
          icon: IconMail,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "GitHub",
      icon: IconBrandGithub,
      url: "https://github.com/unibeck/solstatus",
      external: true,
    },
    {
      title: `${process.env.NEXT_PUBLIC_APP_VERSION}`,
      icon: IconDna,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild variant="ghost" className="h-14">
              <a href="/">
                <SolStatusLogo className="!size-8 fill-black dark:fill-white" />
                <span className={`text-lg font-semibold ${fontUnboundedCN}`}>
                  SolStatus
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
    </Sidebar>
  )
}
