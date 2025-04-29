import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema"; // Use synthetic schema
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts";
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import type { z } from "zod";
import { create } from "zustand";

// Default pagination values
const DEFAULT_PAGE_INDEX = 0;
const DEFAULT_PAGE_SIZE = 10;

// Type for the API response
type SyntheticMonitorApiResponse = {
  data: z.infer<typeof syntheticMonitorsSelectSchema>[];
  totalCount: number;
}

// Define the state structure for the Synthetic Monitors table
interface SyntheticDataTableState {
  // Data
  data: z.infer<typeof syntheticMonitorsSelectSchema>[];
  totalSyntheticMonitors: number;
  isLoading: boolean;

  // Table state
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  // rowSelection: Record<string, boolean>; // Optional: Add if needed
  pagination: PaginationState;

  // Search/Filter state
  searchValue: string;
  runtimeFilter: string | null; // Example filter specific to synthetics

  // Actions
  setData: (data: z.infer<typeof syntheticMonitorsSelectSchema>[]) => void;
  setTotalSyntheticMonitors: (count: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSorting: (sorting: SortingState) => void;
  setColumnFilters: (columnFilters: ColumnFiltersState) => void;
  setColumnVisibility: (columnVisibility: VisibilityState) => void;
  // setRowSelection: (rowSelection: Record<string, boolean>) => void; // Optional
  setPagination: (pagination: PaginationState) => void;
  setSearchValue: (searchValue: string) => void;
  setRuntimeFilter: (runtime: string | null) => void;

  // Data fetching
  fetchSyntheticMonitors: () => Promise<void>;
}

// Create the Zustand store
export const useSyntheticDataTableStore = create<SyntheticDataTableState>((set, get) => ({
  // Initial state
  data: [],
  totalSyntheticMonitors: 0,
  isLoading: false,
  sorting: [{ id: "name", desc: false }], // Default sort by name asc
  columnFilters: [],
  columnVisibility: {
    // Define default visibility for synthetic columns
    createdAt: false,
    updatedAt: false,
    activeAlert: false,
    id: false, // Example: hide ID by default
  },
  // rowSelection: {}, // Optional
  pagination: {
    pageIndex: DEFAULT_PAGE_INDEX,
    pageSize: DEFAULT_PAGE_SIZE,
  },
  searchValue: "",
  runtimeFilter: null,

  // Actions
  setData: (data) => set({ data }),
  setTotalSyntheticMonitors: (totalSyntheticMonitors) =>
    set({ totalSyntheticMonitors }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSorting: (sorting) => set({ sorting }),
  setColumnFilters: (columnFilters) => set({ columnFilters }),
  setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
  // setRowSelection: (rowSelection) => set({ rowSelection }), // Optional
  setPagination: (pagination) => set({ pagination }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setRuntimeFilter: (runtime) => set({ runtimeFilter: runtime }),

  // Data fetching implementation
  fetchSyntheticMonitors: async () => {
    const { pagination, sorting, searchValue, runtimeFilter } = get();
    set({ isLoading: true });

    try {
      const params = new URLSearchParams();
      params.set("page", pagination.pageIndex.toString());
      params.set("pageSize", pagination.pageSize.toString());

      if (sorting.length > 0) {
        params.set("orderBy", sorting[0].id);
        params.set("order", sorting[0].desc ? "desc" : "asc");
      }
      if (searchValue) {
        params.set("search", searchValue);
      }
      if (runtimeFilter) {
        params.set("runtime", runtimeFilter);
      }
      // Add other filters like isRunning if needed

      const response = await fetch(`/api/synthetic-monitors?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Use the defined type for the response JSON
      const result: SyntheticMonitorApiResponse = await response.json(); 

      // Now access result.data and result.totalCount safely
      set({
        data: result.data,
        totalSyntheticMonitors: result.totalCount,
      });
    } catch (error) {
      console.error("Failed to fetch synthetic monitors:", error);
      toast.error(
        "Failed to load synthetic monitors.",
        DEFAULT_TOAST_OPTIONS
      );
      // Optionally reset data on error
      set({ data: [], totalSyntheticMonitors: 0 }); 
    } finally {
      set({ isLoading: false });
    }
  },
})); 