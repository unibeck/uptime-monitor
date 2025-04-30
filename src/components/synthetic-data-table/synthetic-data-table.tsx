"use client"
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React from "react"
import { SyntheticPagination } from "@/components/synthetic-data-table/pagination"
import { SyntheticDataRow } from "@/components/synthetic-data-table/synthetic-data-row"
import { SyntheticDataTableLoadingOverlay } from "@/components/synthetic-data-table/synthetic-data-table-loading-overlay"
import { SyntheticDataTableSkeleton } from "@/components/synthetic-data-table/synthetic-data-table-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Tabs, TabsContent } from "@/registry/new-york-v4/ui/tabs"
import { useSyntheticDataTableStore } from "@/store/synthetic-data-table-store"
import { columns } from "./columns"
import { SyntheticToolbar } from "./synthetic-toolbar"

// Default pagination values
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10
// Define default sort state for synthetics
const DEFAULT_SORTING: SortingState = [{ id: "name", desc: false }] // Example: default sort by name ascending

export function SyntheticDataTable() {
  "use no memo"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get state and actions from the SYNTHETIC store
  const data = useSyntheticDataTableStore((state) => state.data)
  const isLoading = useSyntheticDataTableStore((state) => state.isLoading)
  const totalSyntheticMonitors = useSyntheticDataTableStore(
    (state) => state.totalSyntheticMonitors,
  )
  // const searchValue = useSyntheticDataTableStore((state) => state.searchValue) // Remove unused variable
  // const rowSelection = useSyntheticDataTableStore((state) => state.rowSelection); // If using
  const columnVisibility = useSyntheticDataTableStore(
    (state) => state.columnVisibility,
  )
  const columnFilters = useSyntheticDataTableStore(
    (state) => state.columnFilters,
  )
  const sorting = useSyntheticDataTableStore((state) => state.sorting)
  const pagination = useSyntheticDataTableStore((state) => state.pagination)

  // Update URL with query params, omitting default values
  const updateUrlParams = React.useCallback(
    (params: {
      page?: number
      pageSize?: number
      search?: string
      orderBy?: string
      order?: "asc" | "desc"
      runtime?: string | null
    }) => {
      const newParams = new URLSearchParams(searchParams.toString())

      // Handle page parameter - only include if not default (0)
      if (params.page !== undefined) {
        if (params.page === DEFAULT_PAGE_INDEX) {
          newParams.delete("page")
        } else {
          newParams.set("page", params.page.toString())
        }
      }

      // Handle pageSize parameter - only include if not default (10)
      if (params.pageSize !== undefined) {
        if (params.pageSize === DEFAULT_PAGE_SIZE) {
          newParams.delete("pageSize")
        } else {
          newParams.set("pageSize", params.pageSize.toString())
        }
      }

      // Handle search parameter - only include if not empty
      if (params.search !== undefined) {
        if (params.search) {
          newParams.set("search", params.search)
        } else {
          newParams.delete("search")
        }
      }

      // Handle Runtime Filter - only include if not null/empty
      if (params.runtime !== undefined) {
        if (params.runtime) {
          newParams.set("runtime", params.runtime)
        } else {
          newParams.delete("runtime")
        }
      }

      // Handle Sorting (Align with data-table logic, using synthetic default sort)
      const isDefaultSort =
        params.orderBy === DEFAULT_SORTING[0]?.id &&
        (params.order !== "asc") === DEFAULT_SORTING[0]?.desc // Simplified check: (isDesc) === (defaultIsDesc)

      if (params.orderBy === undefined && params.order === undefined) {
        // No sorting params passed in this update
      } else if (isDefaultSort) {
        // If the intended sort IS the default, ensure the params are removed
        newParams.delete("orderBy")
        newParams.delete("order")
      } else {
        // If the intended sort is NOT the default, set the params
        if (params.orderBy) {
          newParams.set("orderBy", params.orderBy)
          // Set order; default to 'asc' if not provided explicitly
          if (params.order) {
            newParams.set("order", params.order)
          } else {
            newParams.delete("order") // Explicit 'asc' is default, remove param
          }
        } else {
          // Clearing sort explicitly (orderBy is '', null, or undefined)
          // Revert to default by removing params.
          newParams.delete("orderBy")
          newParams.delete("order")
        }
      }

      const queryString = newParams.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname

      // @ts-ignore - Ignoring type error as pathname comes from usePathname and we know it's is a valid typed route
      router.push(newUrl, { scroll: false }) // Add scroll: false
    },
    [pathname, searchParams, router], // Removed DEFAULT_SORTING dependency
  )

  // Handle state changes
  /* // Uncomment and adapt if using row selection
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const store = useSyntheticDataTableStore.getState();
    if (typeof updater === "function") {
      store.setRowSelection(updater(store.rowSelection) as Record<string, boolean>);
    } else {
      store.setRowSelection(updater as Record<string, boolean>);
    }
  };
  */

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const store = useSyntheticDataTableStore.getState()
    let newSorting: SortingState
    if (typeof updater === "function") {
      newSorting = updater(store.sorting)
    } else {
      newSorting = updater
    }
    store.setSorting(newSorting) // Update store first

    // Update URL params based on new sorting state
    updateUrlParams({
      orderBy: newSorting[0]?.id,
      order: newSorting[0]?.desc ? "desc" : "asc",
    })

    store.fetchSyntheticMonitors() // Fetch SYNTHETIC monitors
  }

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater,
  ) => {
    const store = useSyntheticDataTableStore.getState()
    if (typeof updater === "function") {
      store.setColumnFilters(updater(store.columnFilters))
    } else {
      store.setColumnFilters(updater)
    }
  }

  const handleVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    const store = useSyntheticDataTableStore.getState()
    if (typeof updater === "function") {
      store.setColumnVisibility(updater(store.columnVisibility))
    } else {
      store.setColumnVisibility(updater)
    }
  }

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const store = useSyntheticDataTableStore.getState()
    let newPagination: PaginationState
    if (typeof updater === "function") {
      newPagination = updater(store.pagination)
    } else {
      newPagination = updater
    }
    store.setPagination(newPagination) // Update store first

    // Update URL with new pagination values
    updateUrlParams({
      page: newPagination.pageIndex,
      pageSize: newPagination.pageSize,
    })

    store.fetchSyntheticMonitors() // Fetch SYNTHETIC monitors
  }

  // Initialize from URL params on first load
  React.useEffect(() => {
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")
    const searchParam = searchParams.get("search")
    const orderByParam = searchParams.get("orderBy")
    const orderParam = searchParams.get("order")
    const runtimeParam = searchParams.get("runtime")

    const store = useSyntheticDataTableStore.getState()
    let needsFetch = false // Flag to trigger fetch

    // Update pagination from URL if present and different from store
    const currentPageIndex = store.pagination.pageIndex
    const currentPageSize = store.pagination.pageSize
    const targetPageIndex = pageParam
      ? Number.parseInt(pageParam, 10)
      : DEFAULT_PAGE_INDEX
    const targetPageSize = pageSizeParam
      ? Number.parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE
    if (
      targetPageIndex !== currentPageIndex ||
      targetPageSize !== currentPageSize
    ) {
      store.setPagination({
        pageIndex: targetPageIndex,
        pageSize: targetPageSize,
      })
      needsFetch = true
    }

    // Update search from URL if present and different from store
    const currentSearchValue = store.searchValue
    const targetSearchValue = searchParam ?? ""
    if (targetSearchValue !== currentSearchValue) {
      store.setSearchValue(targetSearchValue)
      needsFetch = true
    }

    // Update runtime filter from URL if present and different from store
    const currentRuntimeFilter = store.runtimeFilter
    const targetRuntimeFilter = runtimeParam ?? null // Use null for consistency if needed
    if (targetRuntimeFilter !== currentRuntimeFilter) {
      store.setRuntimeFilter(targetRuntimeFilter)
      needsFetch = true
    }

    // Update sorting from URL if present and different from store
    const currentSorting = store.sorting
    let targetSorting: SortingState = DEFAULT_SORTING // Start with default

    if (orderByParam) {
      targetSorting = [
        {
          id: orderByParam,
          desc: orderParam === "desc",
        },
      ]
    }
    // Check if targetSorting is different from currentSorting
    const sortChanged =
      currentSorting.length !== targetSorting.length ||
      currentSorting[0]?.id !== targetSorting[0]?.id ||
      currentSorting[0]?.desc !== targetSorting[0]?.desc

    if (sortChanged) {
      store.setSorting(targetSorting)
      needsFetch = true
    }

    // Fetch data only if any state was updated or initially
    if (needsFetch || store.data.length === 0) {
      store.fetchSyntheticMonitors() // Fetch SYNTHETIC monitors
    }
  }, [searchParams]) // Depend only on searchParams

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      // rowSelection, // Uncomment if using
      columnFilters,
      pagination,
    },
    // getRowId: (row) => row.id, // Ensure synthetic data has 'id'
    // enableRowSelection: true, // Uncomment if using
    // onRowSelectionChange: handleRowSelectionChange, // Uncomment if using
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleVisibilityChange,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true, // Set manual flags
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.max(
      1,
      Math.ceil(totalSyntheticMonitors / pagination.pageSize),
    ),
  })

  const hasData = data.length > 0

  return (
    // Using Tabs structure for consistency, though only one tab for now
    <Tabs
      defaultValue="syntheticMonitors"
      className="w-full flex-col justify-start gap-6"
    >
      <SyntheticToolbar table={table} />
      <TabsContent
        value="syntheticMonitors"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        {isLoading && !hasData ? (
          <SyntheticDataTableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-lg border relative">
            {isLoading && hasData && <SyntheticDataTableLoadingOverlay />}
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <SyntheticDataRow key={row.id} row={row} /> // Use specific row component
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No synthetic monitors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <SyntheticPagination table={table} />
      </TabsContent>
    </Tabs>
  )
}
