"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2, IconPlayerPlay, IconPlus } from "@tabler/icons-react"
import type { SerializedEditorState } from "lexical"
import { useState } from "react"
import { type ControllerRenderProps, useForm } from "react-hook-form"
import { toast } from "sonner"
import { CREATED } from "stoker/http-status-codes"
import type { z } from "zod"
import { Editor } from "@/components/blocks/editor-00/editor"
import { syntheticMonitorsInsertDTOSchema } from "@/db/zod-schema"
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

type SyntheticMonitorFormData = z.infer<typeof syntheticMonitorsInsertDTOSchema>

interface TestResult {
  statusOutcome: "success" | "failure"
  durationMs: number
  errorMessage?: string
}

export function AddSyntheticMonitorDialog() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<SyntheticMonitorFormData>({
    resolver: zodResolver(syntheticMonitorsInsertDTOSchema),
    defaultValues: {
      name: "",
      checkInterval: 300, // 5 minutes default
      timeoutSeconds: 30, // 30 seconds default
      runtime: "playwright-cf-latest",
      scriptContent: "",
      type: "synthetic", // Ensure type is set
    },
  })

  const handleTestScript = async () => {
    setIsTesting(true)
    setTestResult(null)
    const { runtime, timeoutSeconds, scriptContent } = form.getValues()

    if (!scriptContent) {
      toast.error("Script content cannot be empty.")
      setIsTesting(false)
      return
    }

    try {
      const response = await fetch("/api/monitors/synthetic/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runtime, timeoutSeconds, scriptContent }),
      })

      const result: TestResult = await response.json()
      setTestResult(result)
      if (!response.ok) {
        toast.error(`Test API error: ${result.errorMessage || "Unknown error"}`)
      } else if (result.statusOutcome === "failure") {
        toast.warning(
          `Test script failed: ${result.errorMessage || "Script error"} (${result.durationMs}ms)`,
        )
      } else {
        toast.success(`Test successful (${result.durationMs}ms)`)
      }
    } catch (error) {
      console.error("Test script fetch error:", error)
      toast.error("Failed to run test script. Check console.")
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (values: SyntheticMonitorFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/synthetic-monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData: { message?: string } = await response.json()
        throw new Error(
          errorData?.message || `HTTP error! status: ${response.status}`,
        )
      }

      if (response.status === CREATED) {
        toast.success(
          "Synthetic monitor created successfully!",
          DEFAULT_TOAST_OPTIONS,
        )
        form.reset()
        setIsOpen(false)
      } else {
        console.warn(
          "Monitor creation returned unexpected status:",
          response.status,
        )
        toast.error(
          "Monitor created but received unexpected status.",
          DEFAULT_TOAST_OPTIONS,
        )
      }
    } catch (error) {
      console.error("Failed to create synthetic monitor:", error)
      toast.error(
        `Failed to create monitor: ${error instanceof Error ? error.message : "Unknown error"}`,
        DEFAULT_TOAST_OPTIONS,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconPlus className="mr-2 h-4 w-4" />
          Add Synthetic Monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Synthetic Monitor</DialogTitle>
          <DialogDescription>
            Configure a browser script to simulate user interactions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Login Flow Check" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Interval (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 300"
                        {...field}
                        onChange={(event) =>
                          field.onChange(+event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeoutSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        {...field}
                        onChange={(event) =>
                          field.onChange(+event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="runtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Runtime</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scriptContent"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  SyntheticMonitorFormData,
                  "scriptContent"
                >
              }) => (
                <FormItem>
                  <FormLabel>Browser Script</FormLabel>
                  <FormControl>
                    <Editor
                      editorSerializedState={
                        field.value ? JSON.parse(field.value) : undefined
                      }
                      onSerializedChange={(newState: SerializedEditorState) => {
                        field.onChange(JSON.stringify(newState))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your Playwright or Puppeteer script.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestScript}
                disabled={isTesting || isSubmitting}
              >
                {isTesting ? (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconPlayerPlay className="mr-2 h-4 w-4" />
                )}
                Test Script
              </Button>
              {testResult && (
                <div
                  className={`text-sm px-2 py-1 rounded-md ${testResult.statusOutcome === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {testResult.statusOutcome === "success"
                    ? "Success"
                    : "Failed"}{" "}
                  ({testResult.durationMs}ms)
                  {testResult.statusOutcome === "failure" &&
                    testResult.errorMessage && (
                      <span className="ml-1 text-xs">
                        ({testResult.errorMessage.substring(0, 30)}...)
                      </span>
                    )}
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isTesting}>
                {isSubmitting && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Monitor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
