"use client"

import LatencyRangeChart from "@/components/latency-range-chart"
import { UptimeChart } from "@/components/uptime-chart"
import { WebsiteDetailHeader } from "@/components/website-detail-header"
import { WebsiteSectionCards } from "@/components/website-section-cards"
import { defaultHeaderContent, useHeaderContext } from "@/context/header-context"
import type { uptimeChecksSelectSchema, websitesSelectSchema } from "@/db/zod-schema"
import { msToHumanReadable, secsToHumanReadable } from "@/lib/formatters"
import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs"
import { TooltipContent } from "@/registry/new-york-v4/ui/tooltip"
import { TooltipProvider, TooltipTrigger } from "@/registry/new-york-v4/ui/tooltip"
import { Tooltip } from "@/registry/new-york-v4/ui/tooltip"
import type {
  TimeRange,
} from "@/types/website"
import { IconPointFilled } from "@tabler/icons-react"
import { formatDistance } from "date-fns"
import { ArrowLeft } from "lucide-react"
import type { Route } from 'next'; // Import Route type
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import type { z } from "zod"

// Define the type for a single uptime check
type LatestUptimeCheck = z.infer<typeof uptimeChecksSelectSchema>

export default function WebsiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = params.id as string
  const { setHeaderContent } = useHeaderContext()
  const searchParams = useSearchParams() // Get search params

  const [website, setWebsite] = useState<z.infer<
    typeof websitesSelectSchema
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Initialize timeRange from URL or default to '1d'
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const rangeParam = searchParams.get("range")
    return (rangeParam === "1h" || rangeParam === "1d" || rangeParam === "7d") ? rangeParam : "1d"
  })

  const [uptimeData, setUptimeData] = useState<z.infer<typeof uptimeChecksSelectSchema>[]>([])
  const [latestUptimeCheck, setLatestUptimeCheck] = useState<LatestUptimeCheck | null>(null) // New state for latest check

  const [uptimePercentage, setUptimePercentage] = useState<number | null>(null)
  const [avgLatency, setAvgLatency] = useState<number | null>(null)
  const [isUptimeDataLoading, setIsUptimeDataLoading] = useState(true)
  const [uptimeDataError, setUptimeDataError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWebsite = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/websites/${websiteId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/")
            return
          }
          throw new Error(`Failed to fetch website: ${response.statusText}`)
        }
        const data = await response.json()
        setWebsite(data as z.infer<typeof websitesSelectSchema>)
      } catch (error) {
        console.error("Error fetching website:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (websiteId) {
      fetchWebsite()
    }

    return () => {
      setHeaderContent(defaultHeaderContent)
    }
  }, [websiteId, router, setHeaderContent])

  useEffect(() => {
    if (website) {
      setHeaderContent(
        website.isRunning ? (
          <div className="flex items-center gap-2">
            {latestUptimeCheck && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-muted-foreground underline decoration-dashed cursor-help">
                      {`Checking every ${secsToHumanReadable(website.checkInterval)}`}
                    </p>
                    {/* <span className="underline decoration-dashed cursor-help">
                      {formatDistance(new Date(latestUptimeCheck.timestamp), new Date(), { addSuffix: true })}
                    </span> */}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Latest check:
                    </p>
                    <p>{new Date(latestUptimeCheck.timestamp).toLocaleString(undefined, { 
                      year: 'numeric', 
                      month: 'numeric', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: 'numeric', 
                      second: 'numeric', 
                      timeZoneName: 'short'
                    })}</p>
                    <p>
                      Status: {latestUptimeCheck.status}
                    </p>
                    <p>
                      Latency: {msToHumanReadable(latestUptimeCheck.responseTime ?? 0, true)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {!latestUptimeCheck && (
              <p className="text-sm text-muted-foreground">
                {`Checking every ${secsToHumanReadable(website.checkInterval)}`}
              </p>
            )}

            <div className="relative">
              <IconPointFilled className="absolute text-green-500 animate-ping" />
              <IconPointFilled className="relative z-10 mr-1 text-green-500" />
            </div>
          </div>
        ) : (
          <Badge variant="warning" className="animate-pulse">Paused</Badge>
        )
      )
    }
  }, [website, latestUptimeCheck, setHeaderContent])

  useEffect(() => {
    if (!websiteId) {
      return
    }

    const fetchUptimeData = async () => {
      setIsUptimeDataLoading(true)
      setUptimeDataError(null)

      try {
        const response = await fetch(
          `/api/websites/${websiteId}/uptime/range?range=${timeRange}`,
        )
        if (!response.ok) {
          console.error(
            `Failed to fetch combined data for website ${websiteId} with error: ${response.statusText}`,
          )
          // Reset states on error
          setUptimeData([])
          setUptimePercentage(null)
          setAvgLatency(null)
          setUptimeDataError(`Failed to load data: ${response.statusText}`)
          return
        }
        
        const responseData = (await response.json()) as z.infer<typeof uptimeChecksSelectSchema>[]
        console.log(responseData)
        
        setUptimeData(responseData)        
        setUptimeDataError(null)
      } catch (error) {
        console.error("Error fetching combined uptime/latency data:", error)
        // Reset states on error
        setUptimeData([])
        setUptimeDataError('An error occurred while loading website data.')
      } finally {
        setIsUptimeDataLoading(false)
      }
    }

    fetchUptimeData()
  }, [websiteId, timeRange])

  useEffect(() => {
    if (uptimeData.length > 0) {
      const uptimePercentage = uptimeData.filter(check => check.isUp).length / uptimeData.length * 100
      setUptimePercentage(uptimePercentage)
    } else {
      setUptimePercentage(null)
    }
  }, [uptimeData])

  useEffect(() => {
    if (uptimeData.length > 0) {
      const avgLatency = uptimeData.reduce((sum, check) => sum + (check.responseTime ?? 0), 0) / uptimeData.length
      setAvgLatency(avgLatency)
    } else {
      setAvgLatency(null)
    }
  }, [uptimeData])

  // Fetch latest uptime check
  useEffect(() => {
    if (!websiteId) {
      return
    }

    const fetchLatestUptimeCheck = async () => {
      // Consider adding loading/error state specifically for this fetch if needed
      try {
        const response = await fetch(`/api/websites/${websiteId}/uptime`)
        if (!response.ok) {
          if (response.status !== 404) { // Don't error if no check exists yet
             console.error(`Failed to fetch latest uptime check: ${response.statusText}`)
          }
          setLatestUptimeCheck(null)
          return
        }
        const data = await response.json()
        setLatestUptimeCheck(data as LatestUptimeCheck)
      } catch (error) {
        console.error("Error fetching latest uptime check:", error)
        setLatestUptimeCheck(null) // Reset on error
      }
    }

    fetchLatestUptimeCheck()
  }, [websiteId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading website details...</p>
        </div>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Website not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <WebsiteDetailHeader
            website={website}
          />

          <Tabs
            value={timeRange} // Use value instead of defaultValue
            onValueChange={(value) => {
              const newTimeRange = value as TimeRange
              setTimeRange(newTimeRange)
              // Update URL
              const newPath = newTimeRange === "1d" 
                ? `/websites/${websiteId}` 
                : `/websites/${websiteId}?range=${newTimeRange}`
              router.push(newPath as Route, { scroll: false })
            }}
            className="w-full"
          >
            <div className="flex justify-end items-center mb-3">
              <TabsList>
                <TabsTrigger value="1h">Last 1 Hour</TabsTrigger>
                <TabsTrigger value="1d">Last 1 Day</TabsTrigger>
                <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <WebsiteSectionCards 
            website={website}
            avgResponseTime={avgLatency ?? 0}
            uptimePercentage={uptimePercentage ?? 0}
            loading={isUptimeDataLoading}
            error={uptimeDataError}
          />
          <div className="mt-0 flex flex-col gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-[200px]">
                  <UptimeChart
                    data={uptimeData}
                    timeRange={timeRange}
                    isLoading={isUptimeDataLoading}
                    error={uptimeDataError}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-[400px]">
                  <LatencyRangeChart
                    data={uptimeData}
                    timeRange={timeRange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
