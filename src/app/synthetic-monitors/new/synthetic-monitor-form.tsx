"use client"

import type { UseFormReturn } from "react-hook-form"
import CodeEditor from "@/components/editor/code-editor"
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
import type { SyntheticMonitorFormValues } from "./page"

interface SyntheticMonitorFormProps {
  form: UseFormReturn<SyntheticMonitorFormValues>
  onSubmit: (values: SyntheticMonitorFormValues) => void
}

export function SyntheticMonitorForm({
  form,
  onSubmit,
}: SyntheticMonitorFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Login Flow Check" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your synthetic monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check Interval */}
          <FormField
            control={form.control}
            name="checkInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Interval (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="300"
                    {...field}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    min="1"
                  />
                </FormControl>
                <FormDescription>
                  How often to run the check (e.g., 60, 300, 900).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timeout */}
          <FormField
            control={form.control}
            name="timeoutSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeout (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    min="1"
                  />
                </FormControl>
                <FormDescription>
                  Maximum execution time allowed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Runtime */}
        <FormField
          control={form.control}
          name="runtime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Runtime</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a runtime" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="playwright-cf-latest">
                    Playwright (Cloudflare Latest)
                  </SelectItem>
                  <SelectItem value="puppeteer-cf-latest">
                    Puppeteer (Cloudflare Latest)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The browser automation library to use.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Script Content */}
        <FormField
          control={form.control}
          name="scriptContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Script</FormLabel>
              <FormControl>
                <CodeEditor
                  editorName="scriptContent"
                  onContentChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Write your browser automation script here (JavaScript or
                TypeScript).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
