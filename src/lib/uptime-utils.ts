import type { TimeRange } from "@/types/website"

export function formatTimeLabel(
  timestamp: number,
  timeRange: TimeRange | "24h" | "30d",
  detailed = false,
): string {
  const date = new Date(timestamp)

  if (timeRange === "1h") {
    return detailed
      ? date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (timeRange === "1d" || timeRange === "24h") {
    return detailed
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : `${date.getHours()}:00`
  }

  if (timeRange === "7d") {
    return detailed
      ? date.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : date.toLocaleDateString([], { weekday: "short" })
  }

  return detailed
    ? date.toLocaleDateString([], { month: "short", day: "numeric" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function getIntervalMinutes(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 1 // 1 minute intervals for 1 hour
    case "1d":
      return 24 // 24 minute intervals for 1 day (60 data points)
    case "7d":
      return 168 // 168 minute intervals for 7 days (60 data points)
    default:
      return 1
  }
}

export function getTimeRangeInMinutes(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 60 // 60 minutes
    case "1d":
      return 1440 // 24 hours * 60 minutes
    case "7d":
      return 10080 // 7 days * 24 hours * 60 minutes
    default:
      return 60
  }
}
