"use client"

import {
  IconChevronDown,
  IconLayoutColumns,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import type { z } from "zod"
import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu"
import { Input } from "@/registry/new-york-v4/ui/input"
import { useSyntheticDataTableStore } from "@/store/synthetic-data-table-store"
import type { SyntheticMonitorColumnDef } from "./columns"

interface SyntheticToolbarProps {
  table: Table<z.infer<typeof syntheticMonitorsSelectSchema>>
}

// Adapted for Synthetic Monitors Table
export function SyntheticToolbar({ table }: SyntheticToolbarProps) {
  "use no memo"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get state and actions from the SYNTHETIC store
  const searchValue = useSyntheticDataTableStore((state) => state.searchValue)
  const setSearchValue = useSyntheticDataTableStore(
    (state) => state.setSearchValue,
  )
  const setPagination = useSyntheticDataTableStore(
    (state) => state.setPagination,
  )
  const fetchSyntheticMonitors = useSyntheticDataTableStore(
    (state) => state.fetchSyntheticMonitors,
  )

  // Update URL search params without triggering navigation
  const updateUrlSearchParams = (term: string) => {
    const newParams = new URLSearchParams(searchParams.toString())

    if (term) {
      newParams.set("search", term)
    } else {
      newParams.delete("search")
    }
    // Always reset page to 0 when search term changes
    newParams.delete("page")

    const queryString = newParams.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    // @ts-ignore - Ignoring type error as pathname comes from usePathname and we know it's is a valid typed route
    router.push(newUrl, { scroll: false })
  }

  // Debounced search handler - Modified to align with endpoint toolbar
  const handleSearch = useDebouncedCallback((term: string) => {
    // Update the store with the new search value (already done in onSearchChange)
    // setSearchValue(term); // No need to set here, set immediately in onSearchChange

    // Reset to first page when searching
    setPagination({
      pageIndex: 0, // Use the constant if defined elsewhere
      pageSize: table.getState().pagination.pageSize,
    })

    // Update URL search params
    updateUrlSearchParams(term)

    // Fetch data with new search term
    fetchSyntheticMonitors()
  }, 300) // Keep debounce delay or adjust as needed

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value) // Set value immediately for input responsiveness
    handleSearch(value) // Call debounced handler
  }

  const clearSearch = () => {
    setSearchValue("")
    handleSearch("") // Use debounced handler to clear and fetch
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex items-center">
          <IconSearch className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchValue}
            onChange={onSearchChange}
            className="w-[200px] lg:w-[250px] pl-8"
          />
          {searchValue && (
            <Button
              variant="ghost"
              onClick={clearSearch}
              className="absolute right-1 h-6 w-6 p-0"
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* TODO: Add filters here if needed, similar to endpoint toolbar */}
      </div>

      {/* Column Visibility Toggle - Align button with endpoint toolbar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <IconLayoutColumns className="h-4 w-4" />
            <span className="hidden lg:inline">Customize Columns</span>
            <span className="lg:hidden">Columns</span>
            <IconChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide(),
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {(
                  column.columnDef as SyntheticMonitorColumnDef<
                    z.infer<typeof syntheticMonitorsSelectSchema>
                  >
                ).headerLabel || column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
