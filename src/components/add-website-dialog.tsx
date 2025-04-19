"use client"

import { websitesInsertDTOSchema } from "@/db/zod-schema"
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

interface AddWebsiteDialogProps {
  trigger?: React.ReactNode;
}

export function AddWebsiteDialog({ trigger }: AddWebsiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const formId = "add-website-form"
  
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
    { label: "1 day", value: 86400 }
  ]
  
  const form = useForm<z.infer<typeof websitesInsertDTOSchema>>({
    resolver: zodResolver(websitesInsertDTOSchema),
    defaultValues: {
      name: "",
      url: "",
      checkInterval: 60,
      isRunning: true,
      expectedStatusCode: 200,
    },
  })
  
  const onSubmit = async (data: z.infer<typeof websitesInsertDTOSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.status === HttpStatusCodes.CREATED) {
        toast.success(
          "Website Added", 
          {
            description: `${data.url} has been added successfully.`,
            ...DEFAULT_TOAST_OPTIONS,
          }
        )
        setOpen(false)
      } else if (response.status === HttpStatusCodes.CONFLICT) {
        console.log("Website already exists")
        const error: ConflictWebsiteResponse = await response.json()
        toast.info(
          "Similar website already exists",
          {
            description: error.message,
            ...DEFAULT_TOAST_OPTIONS,
            duration: 10000,
          }
        )
        return
      } else {
        toast.error(
          `Error response: ${response.status}`,
          {
            description: "Unexpected response from server, please try again.",
            ...DEFAULT_TOAST_OPTIONS,
            duration: 10000,
          }
        )
        return
      }
      
      form.reset()
    } catch (error) {
      console.error('Error creating website:', error)
      toast.error(
        'UNKNOWN_ERROR',
        {
          description: "Failed to create website monitor.",
          ...DEFAULT_TOAST_OPTIONS,
          duration: 10000,
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <IconPlus />
      <span className="hidden lg:inline">Add Website</span>
    </Button>
  );
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Website Monitor</DialogTitle>
          <DialogDescription>
            Add a new website to monitor uptime and performance
          </DialogDescription>
        </DialogHeader>
        <div className="px-4">
          <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input placeholder="https://x.com/SolBeckman_" {...field} />
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
                      onValueChange={(value) => field.onChange(Number.parseInt(value, 10))}
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
                        onChange={event => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                        value={field.value ?? ''}
                       />
                    </FormControl>
                    <FormDescription>
                      The specific HTTP status code expected (e.g., 200). Leave empty to accept any 2xx/3xx code.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button variant="primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Monitor"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 