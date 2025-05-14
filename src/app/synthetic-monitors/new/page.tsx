"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MoreVertical } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useHeaderContext } from "@/context/header-context"
import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york-v4/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/registry/new-york-v4/ui/dropdown-menu"
import {
  SyntheticMonitorForm,
} from "./synthetic-monitor-form"

const baseSchema = z.object({
  name: z.string().min(1, "Name is required."),
  checkInterval: z.coerce.number().int().positive("Interval must be positive."),
  timeoutSeconds: z.coerce.number().int().positive("Timeout must be positive."),
  runtime: z.enum(["playwright-cf-latest", "puppeteer-cf-latest"]),
  scriptContent: z.string().min(1, "Script content cannot be empty."),
})

export const syntheticMonitorFormSchema = baseSchema.refine(
  (data) => data.checkInterval >= data.timeoutSeconds + 5,
  {
    message: "Check Interval must be at least 5 seconds greater than Timeout.",
    path: ["checkInterval"],
  },
)

export type SyntheticMonitorFormValues = z.infer<
  typeof syntheticMonitorFormSchema
>

// Define a type for the test script results
interface TestScriptResult {
  success: boolean;
  logs?: string[];
  error?: string;
  durationMs?: number;
  // Assuming the API might return other details, like screenshotUrl or videoUrl in future
  [key: string]: unknown; // Changed any to unknown to satisfy linter
}

export default function CreateSyntheticMonitorPage() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

  // State for Test Script Dialog
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [isTestingScript, setIsTestingScript] = useState(false)
  const [testResult, setTestResult] = useState<TestScriptResult | null>(null)

  const handleCloseDialog = (): void => {
    setIsTestDialogOpen(false);
    return; // Explicit void return
  };

  const form = useForm<SyntheticMonitorFormValues>({
    resolver: zodResolver(syntheticMonitorFormSchema),
    defaultValues: {
      name: "",
      checkInterval: 300,
      timeoutSeconds: 30,
      runtime: "playwright-cf-latest",
      scriptContent: "",
    },
  })

  const onSubmit = useCallback((values: SyntheticMonitorFormValues) => {
    console.log("Form Submitted from page:", values)
    // TODO: Implement API call to POST /api/synthetic-monitors
  }, [])

  const onTestScript = useCallback(
    async (values: SyntheticMonitorFormValues) => {
      setIsTestDialogOpen(true)
      setIsTestingScript(true)
      setTestResult(null)
      console.log("Testing Script with values:", values)

      try {
        const response = await fetch("/api/synthetic-monitors/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scriptContent: values.scriptContent,
            runtime: values.runtime,
            timeoutSeconds: values.timeoutSeconds,
          }),
        })

        const resultData: TestScriptResult = await response.json()

        if (!response.ok) {
          // Use error message from API response if available, otherwise provide a default
          throw new Error(
            resultData.error ||
              `API Error: ${response.status} ${response.statusText}`,
          )
        }
        setTestResult(resultData)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred"
        setTestResult({
          success: false,
          error: errorMessage,
          logs: [`Fetch error: ${errorMessage}`], // Include error in logs for visibility
        })
      } finally {
        setIsTestingScript(false)
      }
    },
    [],
  )

  useEffect(() => {
    setHeaderLeftContent("New Synthetic Monitor")
    setHeaderRightContent(
      <>
        {/* Desktop: Two separate buttons */}
        <div className="hidden lg:flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit(onTestScript)}
          >
            Test Script
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
          >
            Create Monitor
          </Button>
        </div>

        {/* Mobile: Dropdown menu */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="primary" size="icon" type="button">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={form.handleSubmit(onTestScript)}>
                Test Script
              </DropdownMenuItem>
              <DropdownMenuItem onClick={form.handleSubmit(onSubmit)}>
                Create Monitor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    )
    return () => {
      setHeaderRightContent(null)
    }
  }, [setHeaderLeftContent, setHeaderRightContent, form, onSubmit, onTestScript])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <SyntheticMonitorForm form={form} onSubmit={onSubmit} />

      {/* Test Script Results Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Test Script Execution</DialogTitle>
            <DialogDescription>
              {isTestingScript
                ? "Running your script. Please wait..."
                : "Script execution finished. See results below."}
            </DialogDescription>
          </DialogHeader>

          {isTestingScript && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}

          {testResult && !isTestingScript && (
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="font-semibold">
                  Status:{" "}
                  {testResult.success ? (
                    <span className="text-green-600">Success</span>
                  ) : (
                    <span className="text-red-600">Failed</span>
                  )}
                </h3>
                {testResult.durationMs !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {testResult.durationMs} ms
                  </p>
                )}
              </div>

              {testResult.error && (
                <div>
                  <h4 className="font-semibold text-red-600">Error:</h4>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-sm whitespace-pre-wrap break-all">
                    {testResult.error}
                  </pre>
                </div>
              )}

              {testResult.logs && testResult.logs.length > 0 && (
                <div>
                  <h4 className="font-semibold">Logs:</h4>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-sm max-h-60 overflow-y-auto whitespace-pre-wrap break-all">
                    {testResult.logs.join("\\n")}
                  </pre>
                </div>
              )}
              
              {/* Placeholder for other potential results like screenshots/videos */}
              {Object.entries(testResult).map(([key, value]) => {
                if (['success', 'logs', 'error', 'durationMs'].includes(key)) { return null; }
                return (
                  <div key={key}>
                    <h4 className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}:</h4>
                    <pre className="mt-1 p-2 bg-muted rounded-md text-sm whitespace-pre-wrap break-all">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCloseDialog}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
