"use client"
import {
  IconActivity,
  IconLogs,
  IconMetronome,
  IconPencil,
} from "@tabler/icons-react"
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
import type { endpointMonitorsSelectSchema } from "@/db/zod-schema"
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
import { AddEndpointMonitorDialog } from "./add-endpoint-monitor-dialog"

interface WebsiteDetailHeaderProps {
  endpointMonitor: z.infer<typeof endpointMonitorsSelectSchema>
  onStatusChange?: () => void
}

export function EndpointMonitorDetailHeader({
  endpointMonitor,
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
      const response = await fetch(
        `/api/endpoint-monitors/${endpointMonitor.id}/execute-check`,
      )
      if (!response.ok) {
        throw new Error("Failed to execute check")
      }
      toast.success("Check executed", {
        description: "The endpoint monitor check has been manually executed.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh endpoint monitor status after executing check
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
      const response = await fetch(
        `/api/endpoint-monitors/${endpointMonitor.id}/pause`,
        {
          method: "POST",
        },
      )
      if (!response.ok) {
        throw new Error("Failed to pause monitoring")
      }
      toast.success("Monitoring paused", {
        description: "Endpoint monitoring has been paused.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh endpoint monitor status after pausing
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
      const response = await fetch(
        `/api/endpoint-monitors/${endpointMonitor.id}/resume`,
        {
          method: "POST",
        },
      )
      console.log("response", response)
      if (!response.ok) {
        throw new Error("Failed to resume monitoring")
      }
      toast.success("Monitoring resumed", {
        description: "Endpoint monitoring has been resumed.",
        ...DEFAULT_TOAST_OPTIONS,
      })
      // Refresh endpoint monitor status after resuming
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <a
          href={endpointMonitor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center mt-2 hover:text-muted-foreground text-3xl font-bold"
        >
          {endpointMonitor.url}
          <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </a>

        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
          <Badge variant="secondary">
            Expected Status:{" "}
            {endpointMonitor.expectedStatusCode ? (
              <span>{endpointMonitor.expectedStatusCode}</span>
            ) : (
              <span>2xx/3xx</span>
            )}
          </Badge>
          <Badge variant="secondary">
            Alert Threshold: {endpointMonitor.alertThreshold}
          </Badge>
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
            <AddEndpointMonitorDialog
              endpointMonitor={endpointMonitor}
              onSuccess={refreshWebsiteData}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconPencil className="mr-2 h-4 w-4" />
                  Edit Endpoint Monitor
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={executeCheck} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Execute Check
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {endpointMonitor.isRunning && (
              <DropdownMenuItem onClick={pauseMonitoring} disabled={isLoading}>
                <Pause className="mr-2 h-4 w-4" />
                Pause Monitoring
              </DropdownMenuItem>
            )}

            {!endpointMonitor.isRunning && (
              <DropdownMenuItem onClick={resumeMonitoring} disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                Resume Monitoring
              </DropdownMenuItem>
            )}

            {endpointMonitor.isRunning && (
              <DropdownMenuItem onClick={resumeMonitoring} disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                Force Resume Monitoring
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
