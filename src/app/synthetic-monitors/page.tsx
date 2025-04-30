import { SyntheticDataTable } from "@/components/synthetic-data-table/synthetic-data-table"

export const metadata = {
  title: "Synthetic Monitors",
}

export default function SyntheticMonitorsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        {/* <SyntheticSectionCards /> */}
        <SyntheticDataTable />
      </div>
    </div>

    // <div className="container mx-auto py-10">
    //   <h1 className="mb-6 text-2xl font-bold">Synthetic Monitors</h1>
    //   {/* TODO: Add filters or other controls if needed */}
    //   <Suspense fallback={<div>Loading monitors...</div>}>
    //     {/* Render the table component that fetches data */}
    //     <SyntheticDataTable />
    //   </Suspense>
    // </div>
  )
}
