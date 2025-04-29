"use client";

import { Skeleton } from "@/registry/new-york-v4/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/registry/new-york-v4/ui/table";

interface DataTableSkeletonProps {
  columnCount?: number; // Use the count from synthetic columns
  rowCount?: number;
  showHeader?: boolean;
}

// Adapted for Synthetic Monitors Table
export function SyntheticDataTableSkeleton({
  columnCount = 9, // Adjust based on the actual number of visible synthetic columns
  rowCount = 10,
  showHeader = true,
}: DataTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        {showHeader && (
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead key={`skeleton-header-${index}`}>
                  <Skeleton className="h-6 w-full max-w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={`skeleton-row-${rowIndex}`}>
              {Array.from({ length: columnCount }).map((_, cellIndex) => (
                <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                  {/* Basic skeleton layout, adjust if needed based on column widths */}
                  {cellIndex === 0 ? (
                    <Skeleton className="h-5 w-full max-w-[150px]" /> // Name
                  ) : cellIndex === 1 ? (
                    <Skeleton className="h-5 w-full max-w-[80px]" /> // Runtime
                  ) : cellIndex === 2 || cellIndex === 3 ? (
                    <Skeleton className="h-5 w-full max-w-[60px]" /> // Interval/Timeout
                  ) : (
                    <Skeleton className="h-5 w-full max-w-[80px]" /> // Other columns
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 