"use client";

import { DataTableColumnHeader } from "@/components/data-table/column-header";
import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema";
import { Badge } from "@/registry/new-york-v4/ui/badge";
// Import Checkbox only if select column is used, commented out for now
// import { Checkbox } from "@/registry/new-york-v4/ui/checkbox"; 
import { IconBellExclamation } from "@tabler/icons-react"; 
import type { ColumnDef } from "@tanstack/react-table";
import type { z } from "zod"

// Helper function for date formatting
const formatDate = (value: string | number | Date | null | undefined): string => {
  if (value) {
    const date = new Date(value);
    // Check if the date is valid after parsing
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  return "N/A";
};

// Custom ColumnDef type with optional headerLabel
export type SyntheticMonitorColumnDef<TData> = ColumnDef<TData> & {
  headerLabel?: string
}

// Define columns for the Synthetic Monitors table
export const columns: SyntheticMonitorColumnDef<
  z.infer<typeof syntheticMonitorsSelectSchema>
>[] = [
  // Optional: Select column if needed later
  // {
  //   id: "select", 
  //   header: ({ table }) => <Checkbox ... />, 
  //   cell: ({ row }) => <Checkbox ... />, 
  //   enableSorting: false, 
  //   enableHiding: false 
  // },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    headerLabel: "Name",
    cell: ({ row }) => (
       // TODO: Link to a future synthetic monitor details page
       // <Link href={`/synthetic-monitors/${row.original.id}`} className="hover:underline">
         <span>{row.original.name}</span>
       // </Link>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "runtime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Runtime" />
    ),
    headerLabel: "Runtime",
    cell: ({ row }) => {
      const runtime = row.getValue("runtime") as string;
      // Basic formatting, could add icons or specific badges later
      return <Badge variant="outline">{runtime.replace("-cf-latest", "")}</Badge>;
    },
    enableHiding: true,
  },
  {
    accessorKey: "checkInterval",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Interval" />
    ),
    headerLabel: "Interval (sec)",
    cell: ({ row }) => {
      return <span>{row.getValue("checkInterval")}s</span>;
    },
    enableHiding: true,
  },
   {
    accessorKey: "timeoutSeconds",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timeout" />
    ),
    headerLabel: "Timeout (sec)",
    cell: ({ row }) => {
      return <span>{row.getValue("timeoutSeconds")}s</span>;
    },
    enableHiding: true,
  },
  {
    accessorKey: "consecutiveFailures",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Failures" />
    ),
    headerLabel: "Consecutive Failures",
    cell: ({ row }) => {
      const failures = row.getValue("consecutiveFailures") as number | null;
      return (
        <div className="text-center">
          {failures === 1 ? (
            <Badge variant="secondary" className="!bg-yellow-400 dark:!bg-yellow-700">{failures}</Badge>
          ) : failures !== null && failures >= 2 ? (
            <Badge variant="destructive">{failures}</Badge>
          ) : (
            <span>{failures ?? "—"}</span>
          )}
        </div>
      );
    },
    enableHiding: true,
  },
  {
    accessorKey: "isRunning",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    headerLabel: "Status",
    cell: ({ row }) => {
      const isRunning = row.getValue("isRunning") as boolean;
      return isRunning ? (
        <Badge variant="secondary" className="!bg-green-400 dark:!bg-green-700">Running</Badge>
      ) : (
        <Badge variant="destructive">Paused</Badge>
      );
    },
  },
  {
    accessorKey: "activeAlert",
    headerLabel: "Alert Status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Alert" />
    ),
    cell: ({ row }) => {
      const hasAlert = row.getValue("activeAlert") as boolean;
      return (
        <div className="flex items-center justify-center">
          {hasAlert ? (
            <IconBellExclamation className="text-destructive" stroke={1.5} />
          ) : (
            <Badge variant="outline" className="px-2 py-1">—</Badge>
          )}
        </div>
      );
    },
    enableHiding: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    headerLabel: "Created At",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
    enableHiding: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    headerLabel: "Updated At",
    cell: ({ row }) => formatDate(row.getValue("updatedAt")),
    enableHiding: true,
  },
  // Optional: Add actions column later (Edit, Delete, Pause/Resume)
  // {
  //   id: "actions",
  //   cell: ({ row }) => (
  //       <DataTableRowActions row={row} /> // Need to create this component
  //   ),
  // },
]; 