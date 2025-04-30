"use client"

import { useEffect } from "react"
import { SyntheticDataTable } from "@/components/synthetic-data-table/synthetic-data-table"
import { useHeaderContext } from "@/context/header-context"

export default function SyntheticMonitorsPage() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

  useEffect(() => {
    setHeaderLeftContent("Synthetic Monitors")
    setHeaderRightContent(null)
  }, [setHeaderLeftContent, setHeaderRightContent])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* <SyntheticSectionCards /> */}
        <SyntheticDataTable />
      </div>
    </div>
  )
}
