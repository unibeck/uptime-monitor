import type { websitesSelectSchema } from "@/db/zod-schema"
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts"
import type { ColumnFiltersState, PaginationState, SortingState, VisibilityState } from "@tanstack/react-table"
import { toast } from "sonner"
import type { z } from "zod"
import { create } from "zustand"

interface DataTableState {
  // Data
  data: z.infer<typeof websitesSelectSchema>[]
  totalWebsites: number
  isLoading: boolean
  
  // Table state
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: Record<string, boolean>
  pagination: PaginationState
  
  // Search state
  searchValue: string
  
  // Actions
  setData: (data: z.infer<typeof websitesSelectSchema>[]) => void
  setTotalWebsites: (count: number) => void
  setIsLoading: (isLoading: boolean) => void
  setSorting: (sorting: SortingState) => void
  setColumnFilters: (columnFilters: ColumnFiltersState) => void
  setColumnVisibility: (columnVisibility: VisibilityState) => void
  setRowSelection: (rowSelection: Record<string, boolean>) => void
  setPagination: (pagination: PaginationState) => void
  setSearchValue: (searchValue: string) => void
  
  // Data fetching
  fetchWebsites: () => Promise<void>
}

export const useDataTableStore = create<DataTableState>((set, get) => ({
  // Initial state
  data: [],
  totalWebsites: 0,
  isLoading: false,
  sorting: [{ id: "consecutiveFailures", desc: true }],
  columnFilters: [],
  columnVisibility: {
    createdAt: false,
    updatedAt: false,
    activeAlert: false,
  },
  rowSelection: {},
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  searchValue: "",
  
  // Actions
  setData: (data) => set({ data }),
  setTotalWebsites: (totalWebsites) => set({ totalWebsites }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSorting: (sorting) => set({ sorting }),
  setColumnFilters: (columnFilters) => set({ columnFilters }),
  setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
  setRowSelection: (rowSelection) => set({ rowSelection }),
  setPagination: (pagination) => set({ pagination }),
  setSearchValue: (searchValue) => set({ searchValue }),
  
  // Data fetching
  fetchWebsites: async () => {
    const { pagination, searchValue, sorting } = get()
    
    set({ isLoading: true })
    
    // Add a delay for testing purposes
    // await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Construct URL with search and pagination parameters
      const queryParams = new URLSearchParams({
        pageSize: pagination.pageSize.toString(),
        page: pagination.pageIndex.toString(),
      })
      
      // Add sorting parameters if sorting state is not empty
      if (sorting.length > 0) {
        queryParams.set("orderBy", sorting[0].id)
        queryParams.set("order", sorting[0].desc ? "desc" : "asc")
      }
      
      // Add search parameter if present
      if (searchValue) {
        queryParams.set("search", searchValue)
      }
      
      // Fetch websites with query parameters
      const response = await fetch(`/api/websites?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch websites")
      }
      
      const responseData = await response.json() as { 
        data: z.infer<typeof websitesSelectSchema>[];
        totalCount: number;
      }
      
      // Extract data and totalCount from the response
      const { data: websitesData, totalCount } = responseData
      
      // Update state with received data
      set({ 
        data: websitesData as z.infer<typeof websitesSelectSchema>[],
        totalWebsites: totalCount
      })
    } catch (error) {
      console.error("Error fetching websites:", error)
      toast.error("Failed to load websites", {
        ...DEFAULT_TOAST_OPTIONS,
      })
    } finally {
      set({ isLoading: false })
    }
  },
})) 