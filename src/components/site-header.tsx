'use client' // Required because we are using a hook (useContext)

import { ModeToggle } from "@/components/mode-toggle"
import { ThemeSelector } from "@/components/theme-selector"
import { useHeaderContext } from "@/context/header-context"
import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Separator } from "@/registry/new-york-v4/ui/separator"
import { SidebarTrigger } from "@/registry/new-york-v4/ui/sidebar"
import { IconPointFilled } from "@tabler/icons-react"

export function SiteHeader() {
  const { headerContent } = useHeaderContext()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Website Monitors</h1>
        <div className="ml-auto flex items-center gap-2">
          {headerContent}
        </div>
      </div>
    </header>
  )
}
