import { SyntheticDataTable } from "@/components/synthetic-data-table/synthetic-data-table"
import { Suspense } from "react"

// Optional: Add metadata for the page title
export const metadata = {
  title: "Synthetic Monitors",
}

export default function SyntheticMonitorsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-2xl font-bold">Synthetic Monitors</h1>
      {/* TODO: Add filters or other controls if needed */}
      <Suspense fallback={<div>Loading monitors...</div>}>
        {/* Render the table component that fetches data */}
        <SyntheticDataTable />
      </Suspense>
    </div>
  )
}
