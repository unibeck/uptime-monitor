"use client"

import { useEffect } from "react"
import { useHeaderContext } from "@/context/header-context"
import { SyntheticMonitorForm } from "./synthetic-monitor-form"

export default function CreateSyntheticMonitorPage() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

  useEffect(() => {
    setHeaderLeftContent("New Synthetic Monitor")
    setHeaderRightContent(null)
  }, [setHeaderLeftContent, setHeaderRightContent])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <SyntheticMonitorForm />
    </div>
  )
} 