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
      {/* <h1 className="text-2xl font-bold mb-4">Create Synthetic Monitor</h1>
      <p>Form to create a new synthetic monitor will go here.</p> */}
      <SyntheticMonitorForm />
    </div>
  )
} 