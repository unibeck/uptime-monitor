"use client";

import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import type { Row } from "@tanstack/react-table";
import React from "react";

import { Button } from "@/registry/new-york-v4/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";
import type { EmailChannelData } from "./columns"; // Data type for the row

interface EmailChannelActionsProps {
  row: Row<EmailChannelData>;
  onEdit: (emailChannel: EmailChannelData) => void;
  onDelete: (emailChannel: EmailChannelData) => void; // Added onDelete prop
}

export function EmailChannelActions({
  row,
  onEdit,
  onDelete, // Destructure onDelete
}: EmailChannelActionsProps) {
  const emailChannel = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <IconDotsVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(emailChannel)}>
          <IconPencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(emailChannel)} // Call onDelete
          className="text-red-600 hover:!text-red-600 focus:!text-red-600 dark:text-red-500 dark:hover:!text-red-500 dark:focus:!text-red-500"
        >
          <IconTrash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
