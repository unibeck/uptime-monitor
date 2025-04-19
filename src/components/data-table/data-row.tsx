"use client"

import type { websitesSelectSchema } from "@/db/zod-schema"
import { TableCell, TableRow } from "@/registry/new-york-v4/ui/table"
import type { Row } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table"
import type { z } from "zod"

interface DataRowProps {
  row: Row<z.infer<typeof websitesSelectSchema>>
}

export function DataRow({ row }: DataRowProps) {
  "use no memo"
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className="relative"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
} 