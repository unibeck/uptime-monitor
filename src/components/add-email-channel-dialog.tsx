"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus } from "@tabler/icons-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CONFLICT, CREATED, OK } from "stoker/http-status-codes";
import type { z } from "zod";

import type { EmailChannelData } from "@/components/email-channels-data-table/columns";
import {
  emailNotificationChannelInsertSchema,
  // emailNotificationChannelUpdateSchema, // We'll use insert for update for now
} from "@/db/zod-schema";
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts";
import { Button } from "@/registry/new-york-v4/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/new-york-v4/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/registry/new-york-v4/ui/form";
import { Input } from "@/registry/new-york-v4/ui/input";
import { useEmailChannelsTableStore } from "@/store/email-channels-table-store";

// Using the insert schema for both create and update as fields are the same
type EmailChannelFormData = z.infer<
  typeof emailNotificationChannelInsertSchema
>;

interface AddEmailChannelDialogProps {
  trigger?: React.ReactNode;
  emailChannel?: EmailChannelData; // Used for pre-filling form in edit mode
  // onSuccess?: () => void; // Replaced by directly calling fetchEmailChannels
}

export function AddEmailChannelDialog({
  trigger,
  emailChannel,
}: AddEmailChannelDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const formId = "add-email-channel-form";
  const isEditing = !!emailChannel;
  const fetchEmailChannels = useEmailChannelsTableStore(
    (state) => state.fetchEmailChannels
  );

  const form = useForm<EmailChannelFormData>({
    resolver: zodResolver(emailNotificationChannelInsertSchema), // Using insert schema for validation
    defaultValues: isEditing
      ? {
          name: emailChannel.name,
          emailAddress: emailChannel.emailAddress,
        }
      : {
          name: "",
          emailAddress: "",
        },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        isEditing
          ? {
              name: emailChannel.name,
              emailAddress: emailChannel.emailAddress,
            }
          : {
              name: "",
              emailAddress: "",
            }
      );
    }
  }, [open, emailChannel, isEditing, form]);

  const onSubmit = async (data: EmailChannelFormData) => {
    setIsSubmitting(true);
    const url = isEditing
      ? `/api/email-notification-channels/${emailChannel.id}`
      : "/api/email-notification-channels";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const successStatus = isEditing ? OK : CREATED;
      const successMessage = isEditing
        ? "Email Channel Updated"
        : "Email Channel Added";
      const successDescription = isEditing
        ? `Channel "${data.name}" has been updated.`
        : `Channel "${data.name}" has been added.`;

      if (response.status === successStatus) {
        toast.success(successMessage, {
          description: successDescription,
          ...DEFAULT_TOAST_OPTIONS,
        });
        setOpen(false);
        fetchEmailChannels(); // Refresh the table data
      } else if (response.status === CONFLICT) {
        const error: { message: string } = await response.json();
        toast.info("Conflict", {
          description: error.message || "This email address is already in use.",
          ...DEFAULT_TOAST_OPTIONS,
          duration: 10000,
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: "An unexpected error occurred."}));
        toast.error(`Error: ${response.status}`, {
          description: `Failed to ${isEditing ? "update" : "add"} email channel. ${errorData.message}`,
          ...DEFAULT_TOAST_OPTIONS,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} email channel:`,
        error
      );
      toast.error("Operation Failed", {
        description: `An unexpected error occurred while ${isEditing ? "updating" : "creating"} the email channel.`,
        ...DEFAULT_TOAST_OPTIONS,
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
      // Do not reset form here if dialog stays open on error,
      // or reset only on success if preferred.
      // Current behavior: form resets when dialog is reopened due to useEffect.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          // Default trigger if none provided (useful for direct use or testing)
          <Button variant="outline" size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Email Channel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isEditing ? "Edit Email Channel" : "Add New Email Channel"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this email notification channel."
              : "Create a new channel to receive email notifications."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <Form {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Critical Alerts Team" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this channel.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., alerts@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The email address that will receive notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-0">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="primary"
            type="submit"
            form={formId}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditing ? "Saving..." : "Adding..."
              : isEditing
                ? "Save Changes"
                : "Add Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
