"use client"

import type { websitesSelectSchema } from "@/db/zod-schema"
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts"
import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu"
import {
  IconActivity,
  IconLogs,
  IconMetronome,
  IconPencil,
} from "@tabler/icons-react"
import { IconShieldCheckFilled } from "@tabler/icons-react"
import {
  ExternalLink,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { z } from "zod"
import { AddWebsiteDialog } from "./add-website-dialog"

interface WebsiteDetailHeaderProps {
  website: z.infer<typeof websitesSelectSchema>
  onStatusChange?: () => void
}

export function WebsiteDetailHeader({
  website,
  onStatusChange,
}: WebsiteDetailHeaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const refreshWebsiteData = useCallback(async () => {
    if (onStatusChange) {
      onStatusChange()
    }
  }, [onStatusChange])

  const executeCheck = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/websites/${website.id}/execute-check`)
      if (!response.ok) {
        throw new Error("Failed to execute check")
      }
      toast.success("Check executed", {
        description: "The website check has been manually executed.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh website status after executing check
      await refreshWebsiteData()
    } catch (error) {
      toast.error("Failed to execute check", {
        description: `${error}`,
        ...DEFAULT_TOAST_OPTIONS,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pauseMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/websites/${website.id}/pause`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to pause monitoring")
      }
      toast.success("Monitoring paused", {
        description: "Website monitoring has been paused.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh website status after pausing
      await refreshWebsiteData()
    } catch (error) {
      toast.error("Failed to pause monitoring", {
        description: `${error}`,
        ...DEFAULT_TOAST_OPTIONS,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resumeMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/websites/${website.id}/resume`, {
        method: "POST",
      })
      console.log("response", response)
      if (!response.ok) {
        throw new Error("Failed to resume monitoring")
      }
      toast.success("Monitoring resumed", {
        description: "Website monitoring has been resumed.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh website status after resuming
      await refreshWebsiteData()
    } catch (error) {
      toast.error("Failed to resume monitoring", {
        description: `${error}`,
        ...DEFAULT_TOAST_OPTIONS,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{website.name}</h1>
          </div>
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center mt-2 text-muted-foreground hover:text-primary"
          >
            {website.url}
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>
          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <IconShieldCheckFilled className="h-4 w-4" />
            <span>
              Expected Status:
              {website.expectedStatusCode ? (
                <Badge variant="secondary" className="ml-1">
                  {website.expectedStatusCode}
                </Badge>
              ) : (
                <span className="text-xs ml-1">2xx/3xx</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" disabled={isLoading}>
                Logs
                <IconLogs className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a
                  href="https://dash.cloudflare.com/UPDATE_ME_ABC"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconActivity className="mr-2 h-4 w-4" />
                  View Execution
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://dash.cloudflare.com/UPDATE_ME_ABC"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconMetronome className="mr-2 h-4 w-4" />
                  View Trigger
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="primary" disabled={isLoading}>
                Actions
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AddWebsiteDialog
                website={website}
                onSuccess={refreshWebsiteData}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <IconPencil className="mr-2 h-4 w-4" />
                    Edit Website
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={executeCheck} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Execute Check
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {website.isRunning && (
                <DropdownMenuItem
                  onClick={pauseMonitoring}
                  disabled={isLoading}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Monitoring
                </DropdownMenuItem>
              )}

              {!website.isRunning && (
                <DropdownMenuItem
                  onClick={resumeMonitoring}
                  disabled={isLoading}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume Monitoring
                </DropdownMenuItem>
              )}

              {website.isRunning && (
                <DropdownMenuItem
                  onClick={resumeMonitoring}
                  disabled={isLoading}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Force Resume Monitoring
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
