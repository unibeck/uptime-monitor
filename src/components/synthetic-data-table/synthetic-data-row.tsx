"use client";

import type { syntheticMonitorsSelectSchema } from "@/db/zod-schema"; // Use synthetic schema
import { TableCell, TableRow } from "@/registry/new-york-v4/ui/table";
import type { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { z } from "zod";

interface SyntheticDataRowProps {
  row: Row<z.infer<typeof syntheticMonitorsSelectSchema>>; // Use synthetic schema type
}

// Adapted for Synthetic Monitors Table
export function SyntheticDataRow({ row }: SyntheticDataRowProps) {
  "use no memo"; // Keep optimization hint if present in original
  return (
    <TableRow
      // data-state={row.getIsSelected() && "selected"} // Uncomment if using selection
      className="relative"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
} 