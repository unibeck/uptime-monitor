"use client"

import { websitesInsertDTOSchema } from "@/db/zod-schema"
import type { websitesSelectSchema } from "@/db/zod-schema"
import { DEFAULT_TOAST_OPTIONS } from "@/lib/toasts"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/new-york-v4/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/registry/new-york-v4/ui/form"
import { Input } from "@/registry/new-york-v4/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york-v4/ui/select"
import type { ConflictWebsiteResponse } from "@/types/website"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconPlus } from "@tabler/icons-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as HttpStatusCodes from "stoker/http-status-codes"
import type { z } from "zod"

type WebsiteFormData = z.infer<typeof websitesInsertDTOSchema>
type WebsiteData = z.infer<typeof websitesSelectSchema>

interface AddWebsiteDialogProps {
  trigger?: React.ReactNode
  website?: WebsiteData
  onSuccess?: () => void
}

export function AddWebsiteDialog({
  trigger,
  website,
  onSuccess,
}: AddWebsiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const formId = "add-website-form"
  const isEditing = !!website

  const checkIntervalOptions = [
    { label: "10 seconds", value: 10 },
    { label: "30 seconds", value: 30 },
    { label: "60 seconds", value: 60 },
    { label: "2 minutes", value: 120 },
    { label: "5 minutes", value: 300 },
    { label: "10 minutes", value: 600 },
    { label: "15 minutes", value: 900 },
    { label: "30 minutes", value: 1800 },
    { label: "1 hour", value: 3600 },
    { label: "3 hours", value: 10800 },
    { label: "6 hours", value: 21600 },
    { label: "12 hours", value: 43200 },
    { label: "1 day", value: 86400 },
  ]

  const form = useForm<WebsiteFormData>({
    resolver: zodResolver(websitesInsertDTOSchema),
    defaultValues: isEditing
      ? {
          name: website.name ?? "",
          url: website.url ?? "",
          checkInterval: website.checkInterval ?? 60,
          isRunning: website.isRunning ?? true,
          expectedStatusCode: website.expectedStatusCode ?? undefined,
        }
      : {
          name: "",
          url: "",
          checkInterval: 60,
          isRunning: true,
          expectedStatusCode: 200,
        },
  })

  React.useEffect(() => {
    if (open) {
      form.reset(
        isEditing
          ? {
              name: website.name ?? "",
              url: website.url ?? "",
              checkInterval: website.checkInterval ?? 60,
              isRunning: website.isRunning ?? true,
              expectedStatusCode: website.expectedStatusCode ?? undefined,
            }
          : {
              name: "",
              url: "",
              checkInterval: 60,
              isRunning: true,
              expectedStatusCode: 200,
            },
      )
    }
  }, [open, website, isEditing, form])

  const onSubmit = async (data: WebsiteFormData) => {
    setIsSubmitting(true)
    const url = isEditing ? `/api/websites/${website.id}` : "/api/websites"
    const method = isEditing ? "PATCH" : "POST"

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const successStatus = isEditing
        ? HttpStatusCodes.OK
        : HttpStatusCodes.CREATED
      const successMessage = isEditing ? "Website Updated" : "Website Added"
      const successDescription = isEditing
        ? `${data.url} has been updated successfully.`
        : `${data.url} has been added successfully.`

      if (response.status === successStatus) {
        toast.success(successMessage, {
          description: successDescription,
          ...DEFAULT_TOAST_OPTIONS,
        })
        setOpen(false)
        onSuccess?.()
      } else if (response.status === HttpStatusCodes.CONFLICT && !isEditing) {
        console.log("Website already exists")
        const error: ConflictWebsiteResponse = await response.json()
        toast.info("Similar website already exists", {
          description: error.message,
          ...DEFAULT_TOAST_OPTIONS,
          duration: 10000,
        })
        return
      } else {
        const errorText = await response.text()
        toast.error(`Error response: ${response.status}`, {
          description: `Failed to ${isEditing ? "update" : "add"} website. ${errorText || "Unexpected response from server."}`,
          ...DEFAULT_TOAST_OPTIONS,
          duration: 10000,
        })
        return
      }

      form.reset()
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} website:`,
        error,
      )
      toast.error("UNKNOWN_ERROR", {
        description: `Failed to ${isEditing ? "update" : "create"} website monitor.`,
        ...DEFAULT_TOAST_OPTIONS,
        duration: 10000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : isEditing ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Website</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Website Monitor" : "Add Website Monitor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this website monitor."
              : "Add a new website to monitor uptime and performance"}
          </DialogDescription>
        </DialogHeader>
        <div className="px-4">
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
                    <FormLabel>Website Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Website" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://x.com/SolBeckman_"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The full URL to monitor (including https://)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Interval</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(Number.parseInt(value, 10))
                      }
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select check frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkIntervalOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How frequently the website will be checked
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedStatusCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Status Code</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 200"
                        {...field}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      The specific HTTP status code expected (e.g., 200). Leave
                      empty to accept any 2xx/3xx code.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
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
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add Website"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
