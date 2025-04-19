"use client"

import type { AppColumnDef } from "@/components/data-table/columns"
import type { websitesSelectSchema } from "@/db/zod-schema"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu"
import { Input } from "@/registry/new-york-v4/ui/input"
import { useDataTableStore } from "@/store/data-table-store"
import { IconChevronDown, IconLayoutColumns, IconSearch, IconX } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type * as React from "react"
import { useDebouncedCallback } from "use-debounce"
import type { z } from "zod"

interface ToolbarProps {
  table: Table<z.infer<typeof websitesSelectSchema>>
  totalWebsites: number
}

export function Toolbar({ table }: ToolbarProps) {
  "use no memo"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Get state and actions from the store
  const searchValue = useDataTableStore((state) => state.searchValue)
  const setSearchValue = useDataTableStore((state) => state.setSearchValue)
  const setPagination = useDataTableStore((state) => state.setPagination)
  const fetchWebsites = useDataTableStore((state) => state.fetchWebsites)
  
  // Debounce search updates to avoid too many requests
  const handleSearch = useDebouncedCallback((term: string) => {
    // Update the store with the new search value
    setSearchValue(term)
    
    // Reset to first page when searching
    setPagination({
      pageIndex: 0,
      pageSize: table.getState().pagination.pageSize,
    })
    
    // Update URL search params
    updateUrlSearchParams(term)
    
    // Fetch data with new search term
    fetchWebsites()
  }, 500)

  // Update URL search params without triggering navigation
  const updateUrlSearchParams = (term: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    if (term) {
      newParams.set('search', term)
    } else {
      newParams.delete('search')
    }
    
    // Construct the URL, omitting '?' if no parameters
    const queryString = newParams.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
        
    // @ts-ignore - Ignoring type error as pathname comes from usePathname and we know it's is a valid typed route
    router.push(newUrl, { scroll: false })
  }

  // Update search value
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    handleSearch(value)
  }
  
  // Clear search
  const clearSearch = () => {
    setSearchValue("")
    handleSearch("")
  }

  return (
    <div className="flex items-center justify-between">
      <div className="relative flex items-center">
        <IconSearch className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search websites..."
          value={searchValue}
          onChange={onSearchChange}
          className="w-[200px] lg:w-[300px] pl-8"
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
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <IconChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide()
              )
              .map((column) => {
                const headerLabel = (column.columnDef as AppColumnDef<z.infer<typeof websitesSelectSchema>>).headerLabel ?? column.id
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {headerLabel}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 