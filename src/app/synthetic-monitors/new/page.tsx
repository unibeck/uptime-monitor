"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MoreVertical } from "lucide-react"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useHeaderContext } from "@/context/header-context"
import { Button } from "@/registry/new-york-v4/ui/button"
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

export default function CreateSyntheticMonitorPage() {
  const { setHeaderLeftContent, setHeaderRightContent } = useHeaderContext()

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

  const onTestScript = useCallback((values: SyntheticMonitorFormValues) => {
    console.log("Test Script Submitted from page:", values)
    // TODO: Implement API call to POST /api/synthetic-monitors/test
  }, [])

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
    </div>
  )
}
