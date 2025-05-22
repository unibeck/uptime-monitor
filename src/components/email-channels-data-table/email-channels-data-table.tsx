"use client";

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
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react"; // Import useState

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table";
import { IconPlus } from "@tabler/icons-react";

// import { Toolbar } from "@/components/data-table/toolbar"; // Original generic toolbar
import { Pagination } from "@/components/data-table/pagination"; // Reusable
import { DataTableLoadingOverlay } from "@/components/data-table/data-table-loading-overlay";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { AddEmailChannelDialog } from "@/components/add-email-channel-dialog";
import { Button } from "@/registry/new-york-v4/ui/button";

import { toast } from "sonner";
import { NO_CONTENT } from "stoker/http-status-codes";

import { DeleteEmailChannelDialog } from "@/components/delete-email-channel-dialog"; // Import Delete Dialog
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts";
import { useEmailChannelsTableStore } from "@/store/email-channels-table-store";
import { type EmailChannelData, columns } from "./columns";
import { EmailChannelsToolbar } from "./email-channels-toolbar";

// Default pagination values (can be centralized if used by multiple tables)
const DEFAULT_PAGE_INDEX = 0;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_ID = "name";
const DEFAULT_SORT_DESC = false;

export function EmailChannelsDataTable() {
  "use no memo";

  const router = useRouter();
  const pathname = usePathname(); // Should be /settings/email-notifications
  const searchParams = useSearchParams();

  // Get state and actions from the email channels store
  const data = useEmailChannelsTableStore((state) => state.emailChannels);
  const isLoading = useEmailChannelsTableStore((state) => state.isLoading);
  const totalEmailChannels = useEmailChannelsTableStore(
    (state) => state.totalEmailChannels
  );
  const rowSelection = useEmailChannelsTableStore((state) => state.rowSelection);
  const columnVisibility = useEmailChannelsTableStore(
    (state) => state.columnVisibility
  );
  const columnFilters = useEmailChannelsTableStore(
    (state) => state.columnFilters
  );
  const sorting = useEmailChannelsTableStore((state) => state.sorting);
  const pagination = useEmailChannelsTableStore((state) => state.pagination);

  // State for managing the edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<EmailChannelData | null>(
    null
  );

  // Handler to open the dialog in edit mode
  const handleEditOpen = (channel: EmailChannelData) => {
    setEditingChannel(channel);
    setIsEditDialogOpen(true);
  };

  // State for managing the delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<EmailChannelData | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);


  // Handler to open the delete confirmation dialog
  const handleDeleteOpen = (channel: EmailChannelData) => {
    setDeletingChannel(channel);
    setIsDeleteDialogOpen(true);
  };

  // Handler to confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!deletingChannel) return;

    setIsSubmittingDelete(true);
    try {
      const response = await fetch(
        `/api/email-notification-channels/${deletingChannel.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.status === NO_CONTENT) {
        toast.success("Email Channel Deleted", {
          description: `Channel "${deletingChannel.name}" has been deleted.`,
          ...DEFAULT_TOAST_OPTIONS,
        });
        useEmailChannelsTableStore.getState().fetchEmailChannels(); // Refresh table
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete channel." }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting email channel:", error);
      toast.error("Deletion Failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        ...DEFAULT_TOAST_OPTIONS,
      });
    } finally {
      setIsSubmittingDelete(false);
      setIsDeleteDialogOpen(false);
      setDeletingChannel(null);
    }
  };

  const updateUrlParams = React.useCallback(
    (params: {
      page?: number;
      pageSize?: number;
      search?: string;
      orderBy?: string;
      order?: "asc" | "desc";
    }) => {
      const newParams = new URLSearchParams(searchParams.toString());

      if (params.page !== undefined) {
        if (params.page === DEFAULT_PAGE_INDEX) newParams.delete("page");
        else newParams.set("page", params.page.toString());
      }
      if (params.pageSize !== undefined) {
        if (params.pageSize === DEFAULT_PAGE_SIZE) newParams.delete("pageSize");
        else newParams.set("pageSize", params.pageSize.toString());
      }
      if (params.search !== undefined) {
        if (params.search) newParams.set("search", params.search);
        else newParams.delete("search");
      }

      const isDefaultSort =
        params.orderBy === DEFAULT_SORT_ID && params.order === (DEFAULT_SORT_DESC ? "desc" : "asc");

      if (params.orderBy === undefined && params.order === undefined) {
        // No change
      } else if (isDefaultSort) {
        newParams.delete("orderBy");
        newParams.delete("order");
      } else {
        if (params.orderBy) newParams.set("orderBy", params.orderBy);
        else newParams.delete("orderBy"); // Should not happen if order is present
        if (params.order) newParams.set("order", params.order);
        else newParams.delete("order");
      }

      const queryString = newParams.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [pathname, searchParams, router]
  );

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (
    updater
  ) => {
    const store = useEmailChannelsTableStore.getState();
    store.setRowSelection(
      typeof updater === "function"
        ? (updater(store.rowSelection) as Record<string, boolean>)
        : (updater as Record<string, boolean>)
    );
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const store = useEmailChannelsTableStore.getState();
    const newSorting =
      typeof updater === "function" ? updater(store.sorting) : updater;
    store.setSorting(newSorting);
    updateUrlParams({
      orderBy: newSorting[0]?.id,
      order: newSorting[0]?.desc ? "desc" : "asc",
    });
    store.fetchEmailChannels();
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater
  ) => {
    const store = useEmailChannelsTableStore.getState();
    store.setColumnFilters(
      typeof updater === "function"
        ? updater(store.columnFilters)
        : updater
    );
  };

  const handleVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    const store = useEmailChannelsTableStore.getState();
    store.setColumnVisibility(
      typeof updater === "function"
        ? updater(store.columnVisibility)
        : updater
    );
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const store = useEmailChannelsTableStore.getState();
    const newPagination =
      typeof updater === "function" ? updater(store.pagination) : updater;
    store.setPagination(newPagination);
    updateUrlParams({
      page: newPagination.pageIndex,
      pageSize: newPagination.pageSize,
    });
    store.fetchEmailChannels();
  };

  React.useEffect(() => {
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const searchParam = searchParams.get("search");
    const orderByParam = searchParams.get("orderBy");
    const orderParam = searchParams.get("order");

    const store = useEmailChannelsTableStore.getState();
    let needsUpdate = false;

    const targetPageIndex = pageParam
      ? Number.parseInt(pageParam, 10)
      : DEFAULT_PAGE_INDEX;
    const targetPageSize = pageSizeParam
      ? Number.parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE;
    if (
      targetPageIndex !== store.pagination.pageIndex ||
      targetPageSize !== store.pagination.pageSize
    ) {
      store.setPagination({
        pageIndex: targetPageIndex,
        pageSize: targetPageSize,
      });
      needsUpdate = true;
    }

    const targetSearchValue = searchParam ?? "";
    if (targetSearchValue !== store.searchValue) {
      store.setSearchValue(targetSearchValue);
      needsUpdate = true;
    }

    const currentSorting = store.sorting;
    const targetSortingId = orderByParam ?? DEFAULT_SORT_ID;
    const targetSortingDesc = orderParam === "desc" ? true : orderParam === "asc" ? false : DEFAULT_SORT_DESC;

    if (
      currentSorting.length !== 1 ||
      currentSorting[0].id !== targetSortingId ||
      currentSorting[0].desc !== targetSortingDesc
    ) {
      store.setSorting([{ id: targetSortingId, desc: targetSortingDesc }]);
      needsUpdate = true;
    }
    
    if (needsUpdate || store.emailChannels.length === 0 && !store.isLoading) {
      store.fetchEmailChannels();
    }
  }, [searchParams]); // Only re-run if searchParams change

  const table = useReactTable({
    data,
    columns, // Use email channel columns
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id, // Assuming 'id' is a unique identifier for email channels
    enableRowSelection: true,
    onRowSelectionChange: handleRowSelectionChange,
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
    // Pass handlers to the table's meta option
    meta: {
      handleEditOpen,
      handleDeleteOpen, // Pass delete handler
    },
    pageCount: Math.max(
      1,
      Math.ceil(totalEmailChannels / pagination.pageSize)
    ),
  });

  const hasData = data.length > 0;

  return (
    <div className="w-full flex-col justify-start gap-6">
      <EmailChannelsToolbar
        table={table}
        addAction={
          // Dialog for Adding a new channel (no emailChannel prop passed)
          <AddEmailChannelDialog
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Email Channel
              </Button>
            }
            // onSuccess is handled by the dialog itself by calling fetchEmailChannels
          />
        }
      />
      {/* Dialog for Editing an existing channel */}
      {editingChannel && !isDeleteDialogOpen && ( // Ensure delete dialog isn't also trying to open
        <AddEmailChannelDialog
          open={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditDialogOpen(isOpen);
            if (!isOpen) {
              setEditingChannel(null);
            }
          }}
          emailChannel={editingChannel}
        />
      )}
      {/* Dialog for Deleting a channel */}
      <DeleteEmailChannelDialog
        open={isDeleteDialogOpen}
        onOpenChange={(isOpen) => {
          setIsDeleteDialogOpen(isOpen);
          if (!isOpen) {
            setDeletingChannel(null);
          }
        }}
        emailChannel={deletingChannel}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isSubmittingDelete}
      />
      <div className="relative flex flex-col gap-4 overflow-auto mt-4">
        {isLoading && !hasData ? (
          <DataTableSkeleton columnCount={columns.length} />
        ) : (
          <div className="overflow-hidden rounded-lg border relative">
            {isLoading && hasData && <DataTableLoadingOverlay />}
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
                    // Assuming DataRow can be reused. If not, inline or create a specific one.
                    // <DataRow key={row.id} row={row} />
                    // For now, let's inline a simplified version:
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="h-12" // Ensure consistent row height
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-2.5 align-middle"> {/* Added align-middle */}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No email notification channels found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <Pagination table={table} />
      </div>
    </div>
  );
}
