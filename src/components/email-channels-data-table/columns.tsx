"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { type emailNotificationChannelSelectSchema } from "@/db/zod-schema"; // Assuming this will be the schema for the channel data
import { Checkbox } from "@/registry/new-york-v4/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
// Placeholder for Actions component, will be created later
import { EmailChannelActions } from "./email-channel-actions";

// Helper function for date formatting (can be reused or moved to a common util)
const formatDate = (
  value: string | number | Date | null | undefined
): string => {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(); // Or toLocaleString() for date and time
    }
  }
  return "N/A";
};

// Define the shape of the data expected by the table, including monitorCount
export type EmailChannelData = z.infer<
  typeof emailNotificationChannelSelectSchema
> & {
  monitorCount: number;
};

export const columns: ColumnDef<EmailChannelData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "emailAddress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email Address" />
    ),
    cell: ({ row }) => <div>{row.getValue("emailAddress")}</div>,
  },
  {
    accessorKey: "monitorCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monitors Using" />
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("monitorCount")}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("createdAt");
      return formatDate(value as string | number | Date | null | undefined);
    },
    enableHiding: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("updatedAt");
      return formatDate(value as string | number | Date | null | undefined);
    },
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // Access meta from table instance, which should include the onEdit handler
      const meta = table.options.meta as {
        handleEditOpen?: (emailChannel: EmailChannelData) => void;
      };
      return (
        <EmailChannelActions
          row={row}
          onEdit={(channel) => meta.handleEditOpen?.(channel)}
          // onDelete will be implemented later
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
