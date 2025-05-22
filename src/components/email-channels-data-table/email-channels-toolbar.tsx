"use client";

import {
  IconChevronDown,
  IconLayoutColumns,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import type { Table } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useDebouncedCallback } from "use-debounce";

import type { AppColumnDef } from "@/components/data-table/columns"; // Assuming this type can be reused
import { Button } from "@/registry/new-york-v4/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";
import { Input } from "@/registry/new-york-v4/ui/input";
import { useEmailChannelsTableStore } from "@/store/email-channels-table-store"; // Use the correct store
import type { EmailChannelData } from "./columns"; // Use the correct data type

interface EmailChannelsToolbarProps {
  table: Table<EmailChannelData>;
  // totalItems: number; // totalItems is not directly used in the original toolbar for display
  addAction?: React.ReactNode; // Prop to pass the "Add" button or other actions
}

export function EmailChannelsToolbar({
  table,
  addAction,
}: EmailChannelsToolbarProps) {
  "use no memo";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchValue = useEmailChannelsTableStore((state) => state.searchValue);
  const setSearchValue = useEmailChannelsTableStore(
    (state) => state.setSearchValue
  );
  const setPagination = useEmailChannelsTableStore(
    (state) => state.setPagination
  );
  const fetchEmailChannels = useEmailChannelsTableStore(
    (state) => state.fetchEmailChannels
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    setSearchValue(term);
    setPagination({
      pageIndex: 0,
      pageSize: table.getState().pagination.pageSize,
    });

    const newParams = new URLSearchParams(searchParams.toString());
    if (term) {
      newParams.set("search", term);
    } else {
      newParams.delete("search");
    }
    newParams.delete("page"); // Reset page to 0 effectively

    const queryString = newParams.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });

    fetchEmailChannels();
  }, 500);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // No need to call setSearchValue here as handleSearch will do it
    handleSearch(e.target.value);
  };

  const clearSearch = () => {
    handleSearch("");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex items-center">
          <IconSearch className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..." // Updated placeholder
            value={searchValue} // Controlled component
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
      </div>
      <div className="flex items-center gap-2">
        {addAction} {/* Render the passed addAction button/component here */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <IconLayoutColumns className="mr-2 h-4 w-4" />
              Columns
              <IconChevronDown className="ml-2 h-4 w-4" />
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
                // Ensure AppColumnDef is generic enough or use a specific type for EmailChannelData columns
                const headerLabel =
                  (column.columnDef as AppColumnDef<EmailChannelData>)
                    .headerLabel ?? column.id;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    onSelect={(e) => e.preventDefault()} // Prevent menu closing on item select
                  >
                    {headerLabel}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
