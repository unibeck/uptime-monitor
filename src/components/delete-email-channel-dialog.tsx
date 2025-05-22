"use client";

import React from "react";
import type { EmailChannelData } from "@/components/email-channels-data-table/columns";
import { Button } from "@/registry/new-york-v4/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york-v4/ui/dialog";

interface DeleteEmailChannelDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  emailChannel: EmailChannelData | null; // Nullable for safety, though should always be provided when open
  onConfirmDelete: () => void;
  isDeleting?: boolean; // Optional prop to show loading state on confirm button
}

export function DeleteEmailChannelDialog({
  open,
  onOpenChange,
  emailChannel,
  onConfirmDelete,
  isDeleting,
}: DeleteEmailChannelDialogProps) {
  if (!emailChannel) {
    return null; // Or some fallback, though dialog shouldn't be open without a channel
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Email Channel</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the email channel{" "}
            <span className="font-semibold text-foreground">
              "{emailChannel.name}"
            </span>
            ?
            <br />
            It is currently used by{" "}
            <span className="font-semibold text-foreground">
              {emailChannel.monitorCount}
            </span>{" "}
            monitor(s). This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive" // Destructive variant for delete button
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
