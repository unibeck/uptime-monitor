"use client"

import { IconCirclePlusFilled } from "@tabler/icons-react"
import type { Route } from "next"
import Link from "next/link"
import { useEffect } from "react"
import { SyntheticDataTable } from "@/components/synthetic-data-table/synthetic-data-table"
import { useHeaderContext } from "@/context/header-context"
import { Button } from "@/registry/new-york-v4/ui/button"

export default function SyntheticMonitorsPage() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

  useEffect(() => {
    setHeaderLeftContent("Synthetic Monitors")
    setHeaderRightContent(
      <Button variant="primary" asChild>
        <Link href={"/synthetic-monitors/new" as Route}>
          <IconCirclePlusFilled />
          <span>Create Synthetic Monitor</span>
        </Link>
      </Button>,
    )
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
