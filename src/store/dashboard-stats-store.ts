import { create } from "zustand"
import { toast } from "sonner"
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts" // Assuming this path is correct

export interface DashboardStats {
 totalEndpointMonitors: number
  sitesWithAlerts: number
  highestResponseTime: number
  highestResponseTimeWebsiteId: string | null
  uptimePercentage: number


}

interface StatsState {
  // Data
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchDashboardStats: () => Promise<void>
}

export const useStatsStore = create<StatsState>((set, get) => ({
  // Initial state
  stats: null,
  isLoading: true,
  error: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch("/api/endpoint-monitors/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics")
      }
      const data = (await response.json()) as DashboardStats
      set({
        stats: data,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching stats"

      set({
        isLoading: false,
        error: errorMessage,
        stats: null,
      })

      toast.error("Failed to load dashboard statistics", {
        ...DEFAULT_TOAST_OPTIONS,
      })
    }
  },

}))

// Optional: Trigger initial fetch when the store module is loaded
// This can be useful if you want stats available immediately without
// waiting for a component to mount and call fetchDashboardStats.
// However, it might fetch even if the stats aren't needed yet.
// Consider if fetching within a component's useEffect is better for your case.
// useStatsStore.getState().fetchDashboardStats();