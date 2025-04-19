"use client"

import { PolkaDots } from "@/components/bg-patterns/polka-dots"
import type { uptimeChecksSelectSchema } from "@/db/zod-schema"
import type { TimeRange } from "@/types/website"
import {
  format,
  getUnixTime,
  startOfDay,
  startOfHour,
  startOfMinute,
  subDays,
  subHours,
  subWeeks,
} from "date-fns"
import type React from "react"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { z } from "zod"

const getTimeBucketStart = (timestampMs: number, range: TimeRange): number => {
  const date = new Date(timestampMs)
  switch (range) {
    case "1h": {
      return getUnixTime(startOfMinute(date))
    }
    case "1d": {
      const minutes = date.getMinutes()
      const roundedMinutes = Math.floor(minutes / 15) * 15
      const startOfHr = startOfHour(date)
      startOfHr.setMinutes(roundedMinutes, 0, 0)
      return getUnixTime(startOfHr)
    }
    case "7d": {
      const hours = date.getHours()
      const roundedHours = Math.floor(hours / 2) * 2
      const startOfDy = startOfDay(date)
      startOfDy.setHours(roundedHours, 0, 0, 0)
      return getUnixTime(startOfDy)
    }
    default: {
      return Math.floor(timestampMs / 1000) // Fallback, should not happen
    }
  }
}

interface ProcessedUptimeDataPoint {
  timeBucket: number
  count2xx: number
  count3xx: number
  count4xx: number
  count5xx: number
  countNoData: number
  countTotalChecksInBucket: number
}

const processUptimeData = (
  data: z.infer<typeof uptimeChecksSelectSchema>[],
  range: TimeRange,
  // checkIntervalSeconds: number // Needed to calculate expected checks
): ProcessedUptimeDataPoint[] => {
  const now = Date.now()
  let startTime: Date
  const endTime = new Date(now)
  let intervalMinutes: number
  let expectedPoints: number
  // let expectedChecksPerBucket: number

  switch (range) {
    case "1h":
      startTime = subHours(endTime, 1)
      intervalMinutes = 1
      expectedPoints = 60
      break
    case "1d":
      startTime = subDays(endTime, 1)
      intervalMinutes = 15
      expectedPoints = 96 // 24 * (60 / 15)
      break
    case "7d":
      startTime = subWeeks(endTime, 1)
      intervalMinutes = 120 // 2 hours
      expectedPoints = 84 // 7 * (24 / 2)
      break
    default:
      throw new Error("Invalid time range")
  }

  // expectedChecksPerBucket = (intervalMinutes * 60) / checkIntervalSeconds

  const aggregatedData: {
    [key: number]: {
      checks: z.infer<typeof uptimeChecksSelectSchema>[]
    }
  } = {}

  // Aggregate checks into time buckets
  for (const check of data) {
    const bucketStartSeconds = getTimeBucketStart(new Date(check.timestamp).getTime(), range)
    // Only include data within the selected time range
    if (bucketStartSeconds * 1000 >= startTime.getTime()) {
      if (!aggregatedData[bucketStartSeconds]) {
        aggregatedData[bucketStartSeconds] = { checks: [] }
      }
      aggregatedData[bucketStartSeconds].checks.push(check)
    }
  }

  const processedData: ProcessedUptimeDataPoint[] = []
  let currentBucketTime = startTime

  // Align start time to the beginning of its bucket based on range
  switch (range) {
    case "1h":
      currentBucketTime = startOfMinute(startTime)
      break
    case "1d": {
      const startMinutes = startTime.getMinutes()
      currentBucketTime = startOfHour(startTime)
      currentBucketTime.setMinutes(Math.floor(startMinutes / 15) * 15, 0, 0)
      break
    }
    case "7d": {
      const startHours = startTime.getHours()
      currentBucketTime = startOfDay(startTime)
      currentBucketTime.setHours(Math.floor(startHours / 2) * 2, 0, 0, 0)
      break
    }
  }
  const alignedStartTimeMs = currentBucketTime.getTime()

  // Iterate through expected time buckets
  for (let i = 0; i < expectedPoints; i++) {
    const currentBucketTimestampSeconds = getUnixTime(currentBucketTime)

    // Stop if we go past the current time
    if (currentBucketTime > endTime) {
      break
    }

    // Ensure we only process buckets within the aligned range
    if (currentBucketTimestampSeconds * 1000 >= alignedStartTimeMs) {
      const bucketData = aggregatedData[currentBucketTimestampSeconds]
      let count2xx = 0
      let count3xx = 0
      let count4xx = 0
      let count5xx = 0
      let countNoData = 0
      let countTotalChecksInBucket = 0

      if (bucketData) {
        countTotalChecksInBucket = bucketData.checks.length
        for (const check of bucketData.checks) {
          if (!check.status) {
            countNoData++
          } else if (check.status < 300) {
            count2xx++
          } else if (check.status < 400) {
            count3xx++
          } else if ( check.status < 500) {
            count4xx++
          } else if (check.status < 600) {
            count5xx++
          } else {
            countNoData++
          }
        }
      }

      // TODO: Calculate countNoData based on expected checksPerBucket - countTotalChecksInBucket
      // For now, we'll just use the counts based on actual data.

      processedData.push({
        timeBucket: currentBucketTimestampSeconds,
        count2xx,
        count3xx,
        count4xx,
        count5xx,
        countNoData,
        countTotalChecksInBucket,
      })
    }

    // Move to the next bucket time
    currentBucketTime = new Date(
      currentBucketTime.getTime() + intervalMinutes * 60000,
    )
  }

  return processedData
}

const formatXAxis = (tickItem: number, range: TimeRange): string => {
  const date = new Date(tickItem * 1000)
  switch (range) {
    case "1h":
      return format(date, "HH:mm")
    case "1d":
      return format(date, "HH:mm")
    case "7d":
      return format(date, "M/d")
    default:
      return format(date, "HH:mm")
  }
}

interface CustomUptimeTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ProcessedUptimeDataPoint
    value: number // The value of the specific bar segment being hovered
    dataKey: string // The key (e.g., 'count2xx') for the segment
    // name: string // The name assigned to the Bar (e.g., '2xx Success')
    // color: string // The fill color of the segment
  }>
  label?: number // timeBucket (timestamp in seconds)
  range: TimeRange
}

const CustomUptimeTooltip: React.FC<CustomUptimeTooltipProps> = ({
  active,
  payload,
  label,
  range,
}) => {
  if (active && payload && payload.length && label) {
    const dataPoint = payload[0].payload // Full data for the time bucket
    const date = new Date(label * 1000)
    let formattedTime = ""
    switch (range) {
        case "1h": formattedTime = format(date, "HH:mm"); break;
        case "1d": formattedTime = format(date, "MMM d, HH:mm"); break;
        case "7d": formattedTime = format(date, "MMM d, HH:mm"); break;
        default: formattedTime = format(date, "PPpp");
    }

    const totalChecks = dataPoint.countTotalChecksInBucket;
    // TODO: Calculate 'No Data' based on expected checks if needed

    return (
      <div
        className="custom-tooltip border border-accent bg-background p-3 shadow-md"
      >
        <p className="label font-semibold">{`${formattedTime}`}</p>
        <div className="intro mt-1 space-y-0.5 text-sm text-muted-foreground">
           {dataPoint.count2xx > 0 && <p style={{ color: "#22c55e" }}>2xx Success: {dataPoint.count2xx}</p>}
           {dataPoint.count3xx > 0 && <p style={{ color: "#facc15" }}>3xx Redirect: {dataPoint.count3xx}</p>}
           {dataPoint.count4xx > 0 && <p style={{ color: "#f97316" }}>4xx Client Error: {dataPoint.count4xx}</p>}
           {dataPoint.count5xx > 0 && <p style={{ color: "#ef4444" }}>5xx Server Error: {dataPoint.count5xx}</p>}
           {dataPoint.countNoData > 0 && <p style={{ color: "#999" }}>No Data: {dataPoint.countNoData}</p>}
           <p className="mt-1 border-t pt-1">Total Checks: {totalChecks}</p>
        </div>
      </div>
    )
  }

  return null
}

interface UptimeChartProps {
  data: z.infer<typeof uptimeChecksSelectSchema>[]
  timeRange: TimeRange
  isLoading?: boolean
  error?: string | null
}

export const UptimeChart: React.FC<UptimeChartProps> = ({
  data,
  timeRange,
  isLoading = false,
  error = null,
}) => {

  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    return processUptimeData(data, timeRange)
  }, [data, timeRange])

  const xDomain: [number | "auto", number | "auto"] = useMemo(() => {
    if (processedData.length > 0) {
      let startTime: number
      const endTime = Math.floor(Date.now() / 1000)
      const lastBucketTime = processedData[processedData.length - 1]?.timeBucket ?? endTime

      switch (timeRange) {
        case "1h": startTime = getUnixTime(subHours(new Date(), 1)); break;
        case "1d": startTime = getUnixTime(subDays(new Date(), 1)); break;
        case "7d": startTime = getUnixTime(subWeeks(new Date(), 1)); break;
        default: startTime = processedData[0]?.timeBucket ?? endTime - 3600;
      }
      // Ensure the domain covers the full range, even if data is sparse at the end
      return [startTime, Math.max(endTime, lastBucketTime)]
    }
    return ["auto", "auto"] // Fallback if no data
  }, [processedData, timeRange])


  const yDomain: [number | "auto", number | "auto"] = useMemo(() => {
      if (processedData.length === 0 && !isLoading) { 
        return [0, 1]
      }

      let maxCount = 0;
      for (const p of processedData) {
          const totalInBucket = p.count2xx + p.count3xx + p.count4xx + p.count5xx + p.countNoData;
          maxCount = Math.max(maxCount, totalInBucket);
      }

      return [0, Math.max(maxCount, 1)]
  }, [processedData, isLoading]);


  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading chart data...
        </div>
    )
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-600">Error loading chart data: {error}</div>
  }

  if (processedData.length === 0 && !isLoading) {
      return (
        <div className="flex items-center justify-center h-full relative">
            <PolkaDots />
            <div className="relative text-muted-foreground">No uptime data available for the selected period.</div>
        </div>
      )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={processedData}
        margin={{
          top: 16,
          right: 8,
          left: 16,
          bottom: 4,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="timeBucket"
          type="number"
          domain={xDomain}
          tickFormatter={(tick) => formatXAxis(tick, timeRange)}
          scale="time"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
           allowDecimals={false}
           domain={yDomain}
           axisLine={false}
           tickLine={false}
           width={30}
           label={{ 
            value: '# of Checks', 
            angle: -90, 
            position: 'insideLeft', 
            style: { textAnchor: 'middle' },
            offset: -8,
          }}
        />
        <Tooltip
            content={<CustomUptimeTooltip range={timeRange} />}
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }}/>

        {/* Stacked Bars */}
        <Bar dataKey="count2xx" stackId="a" name="2xx" fill="#22c55e" radius={[2, 2, 0, 0]} isAnimationActive={false}/>
        <Bar dataKey="count3xx" stackId="a" name="3xx" fill="#facc15" radius={[0, 0, 0, 0]} isAnimationActive={false}/>
        <Bar dataKey="count4xx" stackId="a" name="4xx" fill="#f97316" radius={[0, 0, 0, 0]} isAnimationActive={false}/>
        <Bar dataKey="count5xx" stackId="a" name="5xx" fill="#ef4444" radius={[0, 0, 0, 0]} isAnimationActive={false}/>
        <Bar dataKey="countNoData" stackId="a" name="No Data" fill="#ccc" radius={[0, 0, 2, 2]} isAnimationActive={false}/>

      </BarChart>
    </ResponsiveContainer>
  )
}
