"use client"

import { LatencyLimitChart } from "@/components/latency-limit-chart"
import type { websitesSelectSchema } from "@/db/zod-schema"
import { secsToHumanReadable } from "@/lib/formatters"
import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Checkbox } from "@/registry/new-york-v4/ui/checkbox"
import { IconBellExclamation, IconLayoutSidebarRightExpand } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import * as React from "react"
import type { z } from "zod"
import { DataTableColumnHeader } from "./column-header"
import { WebsiteDetailDrawer } from "./website-detail-drawer"

// Custom ColumnDef type with optional headerLabel
export type AppColumnDef<TData> = ColumnDef<TData> & {
  headerLabel?: string
}

export const columns: AppColumnDef<z.infer<typeof websitesSelectSchema>>[] = [
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
      <DataTableColumnHeader column={column} title="Website Name" />
    ),
    headerLabel: "Website Name",
    cell: ({ row }) => (
      <Link href={`/websites/${row.original.id}`} className="hover:underline">
        {row.original.name.length > 32 
        ? `${row.original.name.substring(0, 32)}...` 
        : row.original.name}
      </Link>
    ),
    enableHiding: false,
  },
  {
    id: "latency",
    accessorKey: "url",
    header: "Latency",
    headerLabel: "Latency",
    maxSize: 300,
    cell: ({ row }) => {
      return (
        <div className="w-[300px]">
          <LatencyLimitChart 
            websiteId={row.original.id} 
            limit={30}
            height={40}
          />
        </div>
      );
    },
  },
  {
    accessorKey: "checkInterval",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Check Interval" />
    ),
    headerLabel: "Check Interval",
    cell: ({ row }) => {
      const seconds = row.getValue("checkInterval") as number
      return <span>{secsToHumanReadable(seconds)}</span>
    },
    enableHiding: true,
  },
  {
    accessorKey: "consecutiveFailures",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Consecutive Failures" />
    ),
    headerLabel: "Consecutive Failures",
    cell: ({ row }) => {
      const failures = row.getValue("consecutiveFailures") as number | null
      
      // Center the content
      return (
        <div className="text-center">
          {failures === 1 ? (
            <Badge variant="secondary" className="!bg-yellow-400 dark:!bg-yellow-700">
              {failures}
            </Badge>
          ) : failures !== null && failures >= 2 ? (
            <Badge variant="destructive">
              {failures}
            </Badge>
          ) : (
            // Display 0 or — normally
            <span>{failures ?? '—'}</span> 
          )}
        </div>
      )
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
      const isRunning = row.getValue("isRunning") as boolean

      if (isRunning) {
        return (
          <Badge 
            variant="secondary" 
            className="!bg-green-400 dark:!bg-green-700"
          >
            Running
          </Badge>
        )
      }

      return (
        <Badge variant="destructive">
          Paused
        </Badge>
      )
    },
  },
  {
    accessorKey: "activeAlert",
    headerLabel: "Alert Status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Alert Status" />
    ),
    cell: ({ row }) => {
      const hasAlert = row.getValue("activeAlert") as boolean
      return (
        <div className="flex items-center justify-center">
          {hasAlert ? (
            <IconBellExclamation className="text-destructive" stroke={1.5}/>
          ) : (
            <Badge 
              variant="outline"
              className="px-2 py-1"
            >
              —
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    headerLabel: "Created At",
    cell: ({ row }) => {
      const value = row.getValue("createdAt")
      // Check if the value is a valid string or number before creating a Date
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        // Check if the date is valid after parsing
        if (!Number.isNaN(date.getTime())) {
           return <span>{date.toLocaleDateString()}</span>
        }
      }
      return <span>N/A</span> // Fallback for invalid or null dates
    },
    enableHiding: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    headerLabel: "Updated At",
    cell: ({ row }) => {
      const value = row.getValue("updatedAt")
      // Check if the value is a valid string or number before creating a Date
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        // Check if the date is valid after parsing
        if (!Number.isNaN(date.getTime())) {
           return <span>{date.toLocaleDateString()}</span>
        }
      }
      return <span>N/A</span> // Fallback for invalid or null dates
    },
    enableHiding: true,
  },
  {
    id: "open-drawer",
    cell: ({ row }) => (
      <WebsiteDetailDrawer 
        website={row.original} 
        trigger={
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconLayoutSidebarRightExpand />
            <span className="sr-only">Open website details drawer</span>
          </Button>
        }
      />
    ),
  },
]
