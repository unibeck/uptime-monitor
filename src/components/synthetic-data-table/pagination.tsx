"use client"

import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema" // Use synthetic schema
import { Button } from "@/registry/new-york-v4/ui/button"
import { Label } from "@/registry/new-york-v4/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york-v4/ui/select"
import {
  useSyntheticDataTableStore, // Use SYNTHETIC store
} from "@/store/synthetic-data-table-store"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import React from "react"
import type { z } from "zod"

// Interface for the props, using the synthetic schema type
interface SyntheticPaginationProps {
  table: Table<z.infer<typeof syntheticMonitorsSelectSchema>>
}

// Renamed component
export function SyntheticPagination({ table }: SyntheticPaginationProps) {
  "use no memo"

  // Use the SYNTHETIC store
  const pagination = useSyntheticDataTableStore((state) => state.pagination)
  const totalSyntheticMonitors = useSyntheticDataTableStore(
    (state) => state.totalSyntheticMonitors,
  )

  // Calculate page count locally
  const pageCount = Math.max(
    1,
    Math.ceil(totalSyntheticMonitors / pagination.pageSize),
  )

  // Simplified handler: Let the table trigger the fetch via onPaginationChange
  const changePage = React.useCallback(
    (newPageIndex: number) => {
      table.setPageIndex(newPageIndex)
    },
    [table],
  )

  return (
    <div className="flex items-center justify-between px-4">
      {/* Optional: Row selection count (if selection is enabled) */}
      {/* 
       <div> 
         <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
           {table.getFilteredSelectedRowModel().rows.length} of{" "}
           {table.getFilteredRowModel().rows.length} row(s) selected.
         </div>
       </div> 
       */}
      {/* Using a spacer or keeping total count */}
      <div className="text-sm text-muted-foreground">
        Total Monitors: {totalSyntheticMonitors}
      </div>

      <div className="flex w-full items-center gap-8 lg:w-fit">
        {/* Rows per page selector */}
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page-synth" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page-synth">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page number display */}
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {pagination.pageIndex + 1} of {pageCount}
        </div>

        {/* Navigation buttons */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => changePage(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => changePage(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
