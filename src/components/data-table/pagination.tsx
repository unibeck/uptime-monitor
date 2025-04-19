"use client"

import type { websitesSelectSchema } from "@/db/zod-schema"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Label } from "@/registry/new-york-v4/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york-v4/ui/select"
import { useDataTableStore } from "@/store/data-table-store"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import * as React from "react"
import type { z } from "zod"

interface PaginationProps {
  table: Table<z.infer<typeof websitesSelectSchema>>
}

export function Pagination({ table }: PaginationProps) {
  "use no memo"

  const pagination = useDataTableStore((state) => state.pagination)
  const setPagination = useDataTableStore((state) => state.setPagination)
  const fetchWebsites = useDataTableStore((state) => state.fetchWebsites)
  const totalWebsites = useDataTableStore((state) => state.totalWebsites)
  
  // Calculate page count locally to ensure it's consistent
  const pageCount = Math.max(1, Math.ceil(totalWebsites / pagination.pageSize))
  
  // Function to handle page changes directly with the store
  const changePage = React.useCallback((newPageIndex: number) => {
    const newPagination = { ...pagination, pageIndex: newPageIndex }
    setPagination(newPagination)
    // Trigger the table's pagination change which will fetch data
    table.setPageIndex(newPageIndex)
  }, [pagination, setPagination, table])

  return (
    <div className="flex items-center justify-between px-4">
      <div>
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          Total query count: {totalWebsites}
        </div>
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              const size = Number(value)
              setPagination({ ...pagination, pageSize: size })
              table.setPageSize(size)
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 25].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {pagination.pageIndex + 1} of{" "}
          {pageCount}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => changePage(0)}
            disabled={pagination.pageIndex <= 0}
          >
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => changePage(Math.max(0, pagination.pageIndex - 1))}
            disabled={pagination.pageIndex <= 0}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => changePage(Math.min(pageCount - 1, pagination.pageIndex + 1))}
            disabled={pagination.pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => changePage(pageCount - 1)}
            disabled={pagination.pageIndex >= pageCount - 1}
          >
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
} 