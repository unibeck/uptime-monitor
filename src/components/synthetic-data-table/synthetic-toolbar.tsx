"use client";

import type { AppColumnDef } from "./columns"; // Use synthetic columns type definition
import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema";
import { Button } from "@/registry/new-york-v4/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";
import { Input } from "@/registry/new-york-v4/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/registry/new-york-v4/ui/select";
import { useSyntheticDataTableStore } from "@/store/synthetic-data-table-store";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import type { Table } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import type { z } from "zod";

interface SyntheticToolbarProps {
  // Use the specific schema type here
  table: Table<z.infer<typeof syntheticMonitorsSelectSchema>>; 
  totalSyntheticMonitors: number;
}

// Adapted for Synthetic Monitors Table
export function SyntheticToolbar({ table, totalSyntheticMonitors }: SyntheticToolbarProps) {
  "use no memo";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get state and actions from the SYNTHETIC store
  const searchValue = useSyntheticDataTableStore((state) => state.searchValue);
  const setSearchValue = useSyntheticDataTableStore((state) => state.setSearchValue);
  const fetchSyntheticMonitors = useSyntheticDataTableStore((state) => state.fetchSyntheticMonitors);
  const runtimeFilter = useSyntheticDataTableStore((state) => state.runtimeFilter);
  const setRuntimeFilter = useSyntheticDataTableStore((state) => state.setRuntimeFilter);
  
  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set("search", value);
      newParams.set("page", "0"); // Reset to first page on search
    } else {
      newParams.delete("search");
    }
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    // No immediate fetch needed here, useEffect in main table handles it
  }, 300);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const clearSearch = () => {
    setSearchValue("");
    debouncedSearch("");
  };
  
  // Runtime filter handler
  const onRuntimeChange = (value: string) => {
      const newRuntime = value === "all" ? null : value;
      setRuntimeFilter(newRuntime);
      // Update URL params
      const newParams = new URLSearchParams(searchParams.toString());
      if (newRuntime) {
          newParams.set("runtime", newRuntime);
      } else {
          newParams.delete("runtime");
      }
      newParams.set("page", "0"); // Reset page on filter change
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
      fetchSyntheticMonitors(); // Refetch data when filter changes
  };

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
            <Button variant="ghost" onClick={clearSearch} className="absolute right-1 h-6 w-6 p-0">
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Runtime Filter Select */}
        <Select value={runtimeFilter ?? "all"} onValueChange={onRuntimeChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Runtime" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Runtimes</SelectItem>
                <SelectItem value="playwright-cf-latest">Playwright</SelectItem>
                <SelectItem value="puppeteer-cf-latest">Puppeteer</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Column Visibility Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <IconLayoutColumns className="mr-2 h-4 w-4" />
            Columns
            <IconChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
           <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
           <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {(column.columnDef as AppColumnDef<z.infer<typeof syntheticMonitorsSelectSchema>>).headerLabel || column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 