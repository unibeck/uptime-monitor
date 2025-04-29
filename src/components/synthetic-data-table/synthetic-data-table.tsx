"use client";

// Import necessary components and hooks
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/registry/new-york-v4/ui/table";
import { Tabs, TabsContent } from "@/registry/new-york-v4/ui/tabs";
import {
  useSyntheticDataTableStore // Use the SYNTHETIC store
} from "@/store/synthetic-data-table-store"; 
import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  // type RowSelectionState, // Uncomment if using row selection
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { SyntheticPagination } from "@/components/synthetic-data-table/pagination";
import { SyntheticDataRow } from "@/components/synthetic-data-table/synthetic-data-row";
import { SyntheticDataTableLoadingOverlay } from "@/components/synthetic-data-table/synthetic-data-table-loading-overlay";
import { SyntheticDataTableSkeleton } from "@/components/synthetic-data-table/synthetic-data-table-skeleton";
import { columns } from "./columns";
import { SyntheticToolbar } from "./synthetic-toolbar";

// Default pagination values
const DEFAULT_PAGE_INDEX = 0;
const DEFAULT_PAGE_SIZE = 10;

export function SyntheticDataTable() {
  "use no memo";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get state and actions from the SYNTHETIC store
  const data = useSyntheticDataTableStore((state) => state.data);
  const isLoading = useSyntheticDataTableStore((state) => state.isLoading);
  const totalSyntheticMonitors = useSyntheticDataTableStore(
    (state) => state.totalSyntheticMonitors
  );
  // const rowSelection = useSyntheticDataTableStore((state) => state.rowSelection); // If using
  const columnVisibility = useSyntheticDataTableStore((state) => state.columnVisibility);
  const columnFilters = useSyntheticDataTableStore((state) => state.columnFilters);
  const sorting = useSyntheticDataTableStore((state) => state.sorting);
  const pagination = useSyntheticDataTableStore((state) => state.pagination);

  // Update URL with query params, omitting default values
  const updateUrlParams = React.useCallback(
    (params: {
      page?: number;
      pageSize?: number;
      search?: string;
      orderBy?: string;
      order?: "asc" | "desc";
      runtime?: string | null;
      // Add other filters here (e.g., isRunning)
    }) => {
      const newParams = new URLSearchParams(searchParams.toString());

      // Handle Pagination
      if (params.page === DEFAULT_PAGE_INDEX || params.page === undefined) {
        newParams.delete("page");
      } else {
        newParams.set("page", params.page.toString());
      }
      if (params.pageSize === DEFAULT_PAGE_SIZE || params.pageSize === undefined) {
        newParams.delete("pageSize");
      } else {
        newParams.set("pageSize", params.pageSize.toString());
      }

      // Handle Search
      if (!params.search) {
        newParams.delete("search");
      } else {
        newParams.set("search", params.search);
      }
      
      // Handle Runtime Filter
      if (!params.runtime) {
         newParams.delete("runtime");
      } else {
          newParams.set("runtime", params.runtime);
      }

      // Handle Sorting (Similar logic to original DataTable, adjust default sort field if needed)
      const defaultSortField = "name"; // Default sort for synthetics
      const isDefaultSort = 
        (!params.orderBy || params.orderBy === defaultSortField) && 
        (!params.order || params.order === "asc");

      if (params.orderBy === undefined && params.order === undefined) {
        // No sorting params passed
      } else if (isDefaultSort) {
        newParams.delete("orderBy");
        newParams.delete("order");
      } else {
        if (params.orderBy) {
          newParams.set("orderBy", params.orderBy);
          if (params.order) {
            newParams.set("order", params.order);
          } else {
            newParams.delete("order");
          }
        } else {
          newParams.delete("orderBy");
          newParams.delete("order");
        }
      }

      const queryString = newParams.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // @ts-ignore - Ignoring type error as pathname comes from usePathname and we know it's is a valid typed route
      router.push(newUrl);
    },
    [pathname, searchParams, router]
  );

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
    const store = useSyntheticDataTableStore.getState();
    let newSorting: SortingState;
    if (typeof updater === "function") {
      newSorting = updater(store.sorting);
    } else {
      newSorting = updater;
    }
    store.setSorting(newSorting);
    updateUrlParams({
      orderBy: newSorting[0]?.id,
      order: newSorting[0]?.desc ? "desc" : "asc",
    });
    store.fetchSyntheticMonitors(); // Fetch SYNTHETIC monitors
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const store = useSyntheticDataTableStore.getState();
    if (typeof updater === "function") {
      store.setColumnFilters(updater(store.columnFilters));
    } else {
      store.setColumnFilters(updater);
    }
  };

  const handleVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    const store = useSyntheticDataTableStore.getState();
    if (typeof updater === "function") {
      store.setColumnVisibility(updater(store.columnVisibility));
    } else {
      store.setColumnVisibility(updater);
    }
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const store = useSyntheticDataTableStore.getState();
    let newPagination: PaginationState;
    if (typeof updater === "function") {
      newPagination = updater(store.pagination);
    } else {
      newPagination = updater;
    }
    store.setPagination(newPagination);
    updateUrlParams({
      page: newPagination.pageIndex,
      pageSize: newPagination.pageSize,
    });
    store.fetchSyntheticMonitors(); // Fetch SYNTHETIC monitors
  };

  // Initialize from URL params on first load
  React.useEffect(() => {
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const searchParam = searchParams.get("search");
    const orderByParam = searchParams.get("orderBy");
    const orderParam = searchParams.get("order");
    const runtimeParam = searchParams.get("runtime");

    const store = useSyntheticDataTableStore.getState();
    let needsFetch = false; // Flag to trigger fetch

    // Update pagination
    const targetPageIndex = pageParam ? Number.parseInt(pageParam, 10) : DEFAULT_PAGE_INDEX;
    const targetPageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : DEFAULT_PAGE_SIZE;
    if (targetPageIndex !== store.pagination.pageIndex || targetPageSize !== store.pagination.pageSize) {
      store.setPagination({ pageIndex: targetPageIndex, pageSize: targetPageSize });
      needsFetch = true;
    }

    // Update search
    const targetSearchValue = searchParam ?? "";
    if (targetSearchValue !== store.searchValue) {
      store.setSearchValue(targetSearchValue);
      needsFetch = true;
    }
    
    // Update runtime filter
    const targetRuntimeFilter = runtimeParam ?? null;
    if (targetRuntimeFilter !== store.runtimeFilter) {
        store.setRuntimeFilter(targetRuntimeFilter);
        needsFetch = true;
    }

    // Update sorting
    const defaultSortField = "name"; // Match default sort state
    const targetSorting: SortingState = orderByParam ? [{ id: orderByParam, desc: orderParam === "desc" }] : [];
    const currentSorting = store.sorting;
    const currentSortString = currentSorting[0] ? `${currentSorting[0].id}-${currentSorting[0].desc}` : '-';
    const targetSortString = targetSorting[0] ? `${targetSorting[0].id}-${targetSorting[0].desc}` : '-';
    
    if (!orderByParam && currentSorting[0]?.id !== defaultSortField) {
       // No sort in URL, but store isn't default -> reset store to default
       store.setSorting([{ id: defaultSortField, desc: false }]);
       needsFetch = true;
    } else if (orderByParam && currentSortString !== targetSortString) {
        // Sort in URL is different from store -> update store
        store.setSorting(targetSorting);
        needsFetch = true;
    }

    // Fetch data only if state changed or data is initially empty
    if (needsFetch || store.data.length === 0) {
      store.fetchSyntheticMonitors(); // Fetch SYNTHETIC monitors
    }
  }, [searchParams]); // Depend only on searchParams

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
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.max(1, Math.ceil(totalSyntheticMonitors / pagination.pageSize)),
  });

  const hasData = data.length > 0;

  return (
    // Using Tabs structure for consistency, though only one tab for now
    <Tabs defaultValue="syntheticMonitors" className="w-full flex-col justify-start gap-6">
      <SyntheticToolbar table={table} totalSyntheticMonitors={totalSyntheticMonitors} />
      <TabsContent value="syntheticMonitors" className="relative flex flex-col gap-4 overflow-auto">
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
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
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
  );
} 