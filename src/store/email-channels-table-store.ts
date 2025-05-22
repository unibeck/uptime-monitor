import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { create } from "zustand";

import type { EmailChannelData } from "@/components/email-channels-data-table/columns"; // Ensure this path is correct
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts";

interface EmailChannelsTableState {
  // Data
  emailChannels: EmailChannelData[];
  totalEmailChannels: number;
  isLoading: boolean;

  // Table state
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  pagination: PaginationState;

  // Search state
  searchValue: string;

  // Actions
  setEmailChannels: (data: EmailChannelData[]) => void;
  setTotalEmailChannels: (count: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSorting: (sorting: SortingState) => void;
  setColumnFilters: (columnFilters: ColumnFiltersState) => void;
  setColumnVisibility: (columnVisibility: VisibilityState) => void;
  setRowSelection: (rowSelection: Record<string, boolean>) => void;
  setPagination: (pagination: PaginationState) => void;
  setSearchValue: (searchValue: string) => void;

  // Data fetching
  fetchEmailChannels: () => Promise<void>;
}

export const useEmailChannelsTableStore = create<EmailChannelsTableState>(
  (set, get) => ({
    // Initial state
    emailChannels: [],
    totalEmailChannels: 0,
    isLoading: false,
    sorting: [{ id: "name", desc: false }], // Default sort by name
    columnFilters: [],
    columnVisibility: {
      createdAt: false,
      updatedAt: false,
    }, // Initially hide timestamp columns
    rowSelection: {},
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    searchValue: "",

    // Actions
    setEmailChannels: (emailChannels) => set({ emailChannels }),
    setTotalEmailChannels: (totalEmailChannels) =>
      set({ totalEmailChannels }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setSorting: (sorting) => set({ sorting }),
    setColumnFilters: (columnFilters) => set({ columnFilters }),
    setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
    setRowSelection: (rowSelection) => set({ rowSelection }),
    setPagination: (pagination) => set({ pagination }),
    setSearchValue: (searchValue) => set({ searchValue }),

    // Data fetching
    fetchEmailChannels: async () => {
      const { pagination, searchValue, sorting } = get();
      set({ isLoading: true });

      try {
        const queryParams = new URLSearchParams({
          pageSize: pagination.pageSize.toString(),
          page: pagination.pageIndex.toString(),
        });

        if (sorting.length > 0) {
          queryParams.set("orderBy", sorting[0].id);
          queryParams.set("order", sorting[0].desc ? "desc" : "asc");
        }

        if (searchValue) {
          queryParams.set("search", searchValue);
        }

        const response = await fetch(
          `/api/email-notification-channels?${queryParams.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch email channels" }));
          throw new Error(errorData.message || "Failed to fetch email channels");
        }

        const responseData = (await response.json()) as {
          data: EmailChannelData[];
          totalCount: number;
        };

        set({
          emailChannels: responseData.data,
          totalEmailChannels: responseData.totalCount,
        });
      } catch (error) {
        console.error("Error fetching email channels:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load email channels",
          { ...DEFAULT_TOAST_OPTIONS }
        );
        // Optionally set emailChannels to empty array or keep previous state
        set({ emailChannels: [], totalEmailChannels: 0 });
      } finally {
        set({ isLoading: false });
      }
    },
  })
);
