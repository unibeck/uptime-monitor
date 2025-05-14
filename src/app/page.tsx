"use client"

import { IconCirclePlusFilled } from "@tabler/icons-react"
import { useEffect } from "react"
import { AddEndpointMonitorDialog } from "@/components/add-endpoint-monitor-dialog"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useHeaderContext } from "@/context/header-context"
import { Button } from "@/registry/new-york-v4/ui/button"
import { useStatsStore } from "@/store/dashboard-stats-store"
import { useDataTableStore } from "@/store/data-table-store"

export default function Page() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

  const fetchEndpointMonitors = useDataTableStore(
    (state) => state.fetchEndpointMonitors,
  )
  const fetchDashboardStats = useStatsStore(
    (state) => state.fetchDashboardStats,
  )

  useEffect(() => {
    setHeaderLeftContent("Endpoint Monitors")
    setHeaderRightContent(
      <AddEndpointMonitorDialog
        onSuccess={async () => {
          await fetchEndpointMonitors()
          await fetchDashboardStats()
        }}
        trigger={
          <Button variant="primary">
            <IconCirclePlusFilled />
            <span>Create Endpoint Monitor</span>
          </Button>
        }
      />,
    )
  }, [
    setHeaderLeftContent,
    setHeaderRightContent,
    fetchEndpointMonitors,
    fetchDashboardStats,
  ])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <SectionCards />
        <DataTable />
      </div>
    </div>
  )
}
